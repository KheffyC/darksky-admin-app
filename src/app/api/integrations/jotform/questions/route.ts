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
    const questions = await jotformService.getFormQuestions(formId);

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Failed to fetch form questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form questions' },
      { status: 500 }
    );
  }
}
