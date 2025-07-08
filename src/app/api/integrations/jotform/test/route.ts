import { NextRequest, NextResponse } from 'next/server';
import { JotformService } from '@/lib/jotform';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const jotformService = new JotformService(apiKey);
    const isValid = await jotformService.testConnection();

    return NextResponse.json({ isValid });
  } catch (error) {
    console.error('Failed to test Jotform connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
