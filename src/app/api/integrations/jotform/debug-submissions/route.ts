import { NextRequest, NextResponse } from 'next/server';
import { JotformService } from '@/lib/jotform';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, formId, limit = 10, getAllSubmissions = false } = await request.json();

    if (!apiKey || !formId) {
      return NextResponse.json(
        { error: 'API key and form ID are required' },
        { status: 400 }
      );
    }

    const jotformService = new JotformService(apiKey);
    
    // Get submissions with higher limit to see more data
    const submissions = await jotformService.getFormSubmissions(formId, { 
      limit: getAllSubmissions ? 1000 : limit,
      orderBy: 'created_at'
    });
    
    // Return debug info
    return NextResponse.json({
      formId,
      submissionCount: submissions.length,
      oldestSubmission: submissions.length > 0 ? {
        id: submissions[submissions.length - 1]?.id,
        created_at: submissions[submissions.length - 1]?.created_at
      } : null,
      newestSubmission: submissions.length > 0 ? {
        id: submissions[0]?.id,
        created_at: submissions[0]?.created_at
      } : null,
      submissions: submissions.slice(0, Math.min(limit, submissions.length)).map(sub => ({
        id: sub.id,
        created_at: sub.created_at,
        status: sub.status,
        answerCount: Object.keys(sub.answers).length,
        answers: Object.fromEntries(
          Object.entries(sub.answers).map(([key, answer]) => [
            key, 
            {
              text: (answer as any).text,
              type: (answer as any).type,
              answer: (answer as any).answer,
              name: (answer as any).name
            }
          ])
        )
      }))
    });
  } catch (error) {
    console.error('Failed to debug submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission data' },
      { status: 500 }
    );
  }
}
