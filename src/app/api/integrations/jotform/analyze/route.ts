import { NextRequest, NextResponse } from 'next/server';
import { JotformService } from '@/lib/jotform';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, formId } = await request.json();

    if (!apiKey || !formId) {
      return NextResponse.json(
        { error: 'API key and form ID are required' },
        { status: 400 }
      );
    }

    const jotformService = new JotformService(apiKey);
    
    // Get form questions
    const questions = await jotformService.getFormQuestions(formId);
    
    // Filter out HTML/contract fields before sending to frontend
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
      
      return !contractKeywords.some(keyword => text.includes(keyword));
    });
    
    // Get a sample submission to see actual data structure
    const submissions = await jotformService.getFormSubmissions(formId, { limit: 1 });
    
    // Generate smart field mappings using filtered questions
    const suggestedMappings = jotformService.generateDefaultFieldMappings(filteredQuestions);

    return NextResponse.json({
      questions: filteredQuestions,
      totalQuestionsFound: questions.length,
      filteredCount: filteredQuestions.length,
      sampleSubmission: submissions[0] || null,
      suggestedMappings
    });
  } catch (error) {
    console.error('Failed to analyze form:', error);
    return NextResponse.json(
      { error: 'Failed to analyze form structure' },
      { status: 500 }
    );
  }
}
