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
    // Compound fields (phone, date, full name, address) return an object
    answer?: string | Record<string, string>;
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
  mailingAddress?: string;
  school?: string;
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
        if (!answer) return;

        if (mapping.memberField === 'birthday') {
          const birthday = parseJotformDate(answer.answer);
          if (birthday) memberData.birthday = birthday;
          return;
        }

        const text = answerToText(answer);
        // Skip blank answers so an empty optional field can't overwrite a value
        if (!text) return;

        if (mapping.memberField === 'age') {
          const age = parseInt(text, 10);
          if (!isNaN(age)) memberData.age = age;
        } else {
          (memberData as any)[mapping.memberField] = text;
        }
      });

      if (memberData.birthday && memberData.age === undefined) {
        memberData.age = calculateAge(memberData.birthday);
      }

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
      if (!memberData.email || !emailRegex.test(memberData.email)) {
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
        'consent', 'policy', 'disclaimer', 'initial'
      ];
      
      if (contractKeywords.some(keyword => text.includes(keyword))) {
        return false;
      }
      
      return true;
    });
    
    // Common field name patterns. Order matters: the first match wins, so
    // specific patterns (parent email, mailing address) come before general ones.
    const fieldPatterns = {
      legalName: /legal.*name|full.*name|complete.*name|^name$|student.*name|applicant.*name/i,
      parentEmail: /parent.*email|guardian.*email|co-?signer.*email/i,
      email: /email|e-mail/i,
      parentPhone: /parent.*phone|guardian.*phone|co-?signer.*phone/i,
      phone: /phone|mobile|cell/i,
      mailingAddress: /mailing/i,
      address: /address|street/i,
      birthday: /birth.*date|date.*of.*birth|birthday|\bdob\b/i,
      age: /\bage\b/i,
      school: /school/i,
      serialNumber: /serial/i,
      section: /\bsection\b/i,
      instrument: /\binstrument\b/i,
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
      mailingAddress: 'Mailing Address',
      school: 'School',
      birthday: 'Birthday',
      age: 'Age',
      section: 'Section',
      instrument: 'Instrument',
      serialNumber: 'Serial Number'
    };
    return displayNames[field] || field;
  }
}

/**
 * Flatten a Jotform answer to a single trimmed string. Compound fields such as
 * control_phone return an object (e.g. { full: "(555) 555-5555" }).
 */
function answerToText(answer: JotformSubmission['answers'][string]): string {
  const value = answer.answer;
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    if (typeof value.full === 'string') return value.full.trim();
    if (answer.prettyFormat) return answer.prettyFormat.trim();
    return Object.values(value).filter(Boolean).join(' ').trim();
  }
  return '';
}

/**
 * Parse a Jotform date answer to YYYY-MM-DD. Date fields return an object like
 * { datetime: "2008-05-12 00:00:00", litemode: "05/12/2008" } or
 * { month, day, year }; parsed by hand to avoid timezone shifts.
 */
export function parseJotformDate(value: string | Record<string, string> | undefined): string | undefined {
  if (!value) return undefined;

  let year: string | undefined;
  let month: string | undefined;
  let day: string | undefined;

  const fromString = (str: string) => {
    const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return [iso[1], iso[2], iso[3]];
    const us = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (us) return [us[3], us[1], us[2]];
    return undefined;
  };

  if (typeof value === 'string') {
    [year, month, day] = fromString(value.trim()) ?? [];
  } else if (value.datetime || value.litemode) {
    [year, month, day] = fromString((value.datetime || value.litemode).trim()) ?? [];
  } else {
    ({ year, month, day } = value);
  }

  const y = Number(year), m = Number(month), d = Number(day);
  if (!y || !m || !d || m > 12 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Age in whole years as of today, from a YYYY-MM-DD birthday. */
export function calculateAge(birthday: string): number | undefined {
  const [y, m, d] = birthday.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) {
    age--;
  }
  return age;
}

export default JotformService;
