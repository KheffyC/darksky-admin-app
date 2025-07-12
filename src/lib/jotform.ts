import axios from 'axios';

export interface JotformSubmission {
  id: string;
  form_id: string;
  ip: string;
  created_at: string;
  updated_at: string;
  status: string;
  new: string;
  flag: string;
  notes: string;
  answers: Record<string, {
    name: string;
    order: string;
    text: string;
    type: string;
    answer?: string;
    prettyFormat?: string;
  }>;
}

export interface JotformForm {
  id: string;
  username: string;
  title: string;
  height: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_submission: string;
  new: string;
  count: string;
  type: string;
  favorite: string;
  archived: string;
  url: string;
}

export interface JotformQuestion {
  qid: string;
  type: string;
  text: string;
  order: string;
  name: string;
  required: string;
  readonly: string;
  hidden: string;
  labelAlign: string;
  hint: string;
  options?: string;
  special?: string;
  validation?: string;
}

export interface FieldMapping {
  jotformField: string;
  jotformFieldName: string;
  memberField: string;
  memberFieldName: string;
  required: boolean;
}

export interface MemberData {
  firstName: string;
  lastName: string;
  legalName?: string;
  email: string;
  phone?: string;
  parentEmail?: string;
  parentPhone?: string;
  address?: string;
  birthday?: string;
  age?: number;
  section?: string;
  season: string;
  instrument?: string;
  serialNumber?: string;
  jotformSubmissionId: string;
  source: 'jotform';
}

export class JotformService {
  private apiKey: string;
  private baseUrl = 'https://api.jotform.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        params: { apiKey: this.apiKey }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Jotform connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all forms for the user
   */
  async getForms(): Promise<JotformForm[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/forms`, {
        params: { apiKey: this.apiKey }
      });
      return response.data.content || [];
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      throw new Error('Failed to fetch forms from Jotform');
    }
  }

  /**
   * Get form questions/fields
   */
  async getFormQuestions(formId: string): Promise<JotformQuestion[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/form/${formId}/questions`, {
        params: { apiKey: this.apiKey }
      });
      return Object.values(response.data.content || {}) as JotformQuestion[];
    } catch (error) {
      console.error('Failed to fetch form questions:', error);
      throw new Error('Failed to fetch form questions from Jotform');
    }
  }

  /**
   * Get form submissions
   */
  async getFormSubmissions(
    formId: string, 
    options: {
      limit?: number;
      offset?: number;
      filter?: string;
      orderBy?: string;
    } = {}
  ): Promise<JotformSubmission[]> {
    try {
      const params = {
        apiKey: this.apiKey,
        limit: options.limit || 100,
        offset: options.offset || 0,
        ...(options.filter && { filter: options.filter }),
        ...(options.orderBy && { orderBy: options.orderBy })
      };

      const response = await axios.get(`${this.baseUrl}/form/${formId}/submissions`, {
        params
      });
      return response.data.content || [];
    } catch (error) {
      console.error('Failed to fetch form submissions:', error);
      throw new Error('Failed to fetch form submissions from Jotform');
    }
  }

  /**
   * Get submissions since a specific date
   */
  async getSubmissionsSince(formId: string, since: Date): Promise<JotformSubmission[]> {
    const filter = JSON.stringify({
      created_at: {
        $gt: since.toISOString()
      }
    });

    return this.getFormSubmissions(formId, {
      filter,
      orderBy: 'created_at'
    });
  }

  /**
   * Map Jotform submission to member data
   */
  mapSubmissionToMember(
    submission: JotformSubmission, 
    fieldMapping: FieldMapping[],
    defaultSeason: string
  ): MemberData | null {
    try {
      const memberData: Partial<MemberData> = {
        jotformSubmissionId: submission.id,
        source: 'jotform',
        season: defaultSeason
      };

      // Apply field mappings
      fieldMapping.forEach(mapping => {
        const answer = submission.answers[mapping.jotformField];
        
        if (answer && (answer.answer || answer.answer === '')) {
          let value: any = answer.answer;
          
          // Type conversions
          if (mapping.memberField === 'age') {
            value = parseInt(value, 10);
            if (isNaN(value)) value = undefined;
          } else if (mapping.memberField === 'birthday') {
            // Handle various date formats
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              value = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
              value = undefined;
            }
          }

          if (value !== undefined) {
            (memberData as any)[mapping.memberField] = value;
          }
        }
      });

      // Handle name splitting if we only have legal name
      if (memberData.legalName && (!memberData.firstName || !memberData.lastName)) {
        const nameParts = memberData.legalName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          memberData.lastName = nameParts[nameParts.length - 1]; // Last part as last name
          memberData.firstName = nameParts.slice(0, -1).join(' '); // Everything else as first name
        } else if (nameParts.length === 1) {
          // If only one name part, use it as first name and set a placeholder last name
          memberData.firstName = nameParts[0];
          memberData.lastName = '---';
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberData.email)) {
        console.warn('Invalid email format in submission:', submission.id);
        return null;
      }

      return memberData as MemberData;
    } catch (error) {
      console.error('Error mapping submission to member:', error);
      return null;
    }
  }

  /**
   * Generate default field mappings based on form questions
   */
  generateDefaultFieldMappings(questions: JotformQuestion[]): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    // Filter out HTML/display fields and contract text
    const filteredQuestions = questions.filter(question => {
      const text = question.text.toLowerCase();
      const type = question.type.toLowerCase();
      
      // Skip HTML content, display text, and contract fields
      if (type === 'control_text' || type === 'control_html' || type === 'control_head') {
        return false;
      }
      
      // Skip fields with HTML tags
      if (question.text.includes('<') && question.text.includes('>')) {
        return false;
      }
      
      // Skip page break fields
      if (question.text.toLowerCase().includes('page break') || 
          question.name.toLowerCase().includes('page break') ||
          question.qid.toLowerCase().includes('pagebreak') ||
          type === 'control_pagebreak') {
        return false;
      }
      
      // Skip contract/legal text (common phrases)
      const contractKeywords = [
        'contract', 'agreement', 'terms', 'conditions', 'liability',
        'waiver', 'release', 'acknowledge', 'signature',
        'consent', 'policy', 'disclaimer'
      ];
      
      if (contractKeywords.some(keyword => text.includes(keyword))) {
        return false;
      }
      
      return true;
    });
    
    // Common field name patterns
    const fieldPatterns = {
      legalName: /legal.*name|full.*name|complete.*name|^name$|student.*name|applicant.*name/i,
      email: /email|e-mail/i,
      parentEmail: /parent.*email|guardian.*email|co-signer.*email/i,
      phone: /phone|mobile|cell/i,
      parentPhone: /parent.*phone|guardian.*phone|co-signer.*phone/i,
      address: /address|street|mailing/i,
      birthday: /birth.*date|birthday|dob/i,
      age: /age/i,
      section: /section|group|team|class/i,
      instrument: /instrument|plays|musical|section/i,
      serialNumber: /serial|serial.*number|instrument.*number/i
    };

    filteredQuestions.forEach(question => {
      const questionText = question.text.toLowerCase();
      const questionName = question.name.toLowerCase();
      
      for (const [memberField, pattern] of Object.entries(fieldPatterns)) {
        if (pattern.test(questionText) || pattern.test(questionName)) {
          mappings.push({
            jotformField: question.qid,
            jotformFieldName: question.text,
            memberField,
            memberFieldName: this.getMemberFieldDisplayName(memberField),
            required: memberField === 'legalName' || memberField === 'email'
          });
          break;
        }
      }
    });

    return mappings;
  }

  private getMemberFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      legalName: 'Legal Name',
      email: 'Email',
      parentEmail: 'Parent/Cosigner Email',
      phone: 'Phone',
      parentPhone: 'Parent/Cosigner Phone',
      address: 'Physical Address',
      birthday: 'Birthday',
      age: 'Age',
      section: 'Section',
      instrument: 'Instrument',
      serialNumber: 'Serial Number'
    };
    return displayNames[field] || field;
  }
}

export default JotformService;
