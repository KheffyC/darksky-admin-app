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
    
    // Get all form questions without filtering
    const allQuestions = await jotformService.getFormQuestions(formId);
    
    return NextResponse.json({
      questions: allQuestions
    });
  } catch (error) {
    console.error('Failed to get raw form questions:', error);
    return NextResponse.json(
      { error: 'Failed to get form questions' },
      { status: 500 }
    );
  }
}
