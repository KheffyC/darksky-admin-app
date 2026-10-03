import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { isServablePath } from '@/lib/files';

// GET /api/files/<pathname> - Stream a private file to a signed-in user
export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const pathname = path.join('/');
  if (!isServablePath(pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        // Files are never overwritten (each upload gets a new name), so caching is safe
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to read file:', pathname, error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
