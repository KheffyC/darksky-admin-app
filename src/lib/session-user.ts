import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/** The signed-in user's id, or a 401 response to return as-is. */
export async function requireUserId(): Promise<string | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session.user.id;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

export function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
