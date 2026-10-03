import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getViewingSeason } from '@/lib/current-season';
import { isFileFolder, uploadFile, UploadError } from '@/lib/files';

// POST /api/files - Upload a file (multipart: file, folder) and get back its pathname
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const folder = form.get('folder');
    if (!(file instanceof File) || !isFileFolder(folder)) {
      return NextResponse.json({ error: 'A file and a valid folder are required' }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const pathname = await uploadFile(folder, file, season);
    return NextResponse.json({ pathname }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Upload failed:', error);
    // The store connects either by BLOB_READ_WRITE_TOKEN or by BLOB_STORE_ID + Vercel OIDC
    if (error instanceof Error && error.message.includes('No blob credentials found')) {
      return NextResponse.json(
        { error: 'File storage is not connected. Connect the Blob store to this project in Vercel and redeploy.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: `Upload failed: ${error instanceof Error ? error.message : 'unknown error'}` }, { status: 500 });
  }
}
