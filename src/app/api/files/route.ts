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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'File storage is not connected. Create a private Blob store in Vercel and connect it to this project.' },
      { status: 503 },
    );
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
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
