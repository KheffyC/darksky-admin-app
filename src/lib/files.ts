import { del, put } from '@vercel/blob';

// Top-level folders uploads may go into; /api/files only serves these
export const FILE_FOLDERS = ['receipts', 'events'] as const;
export type FileFolder = (typeof FILE_FOLDERS)[number];

// Vercel rejects request bodies over 4.5 MB before they reach the route
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export function isFileFolder(value: unknown): value is FileFolder {
  return typeof value === 'string' && (FILE_FOLDERS as readonly string[]).includes(value);
}

export function isServablePath(pathname: string) {
  const [folder] = pathname.split('/');
  return isFileFolder(folder) && !pathname.includes('..');
}

/** Stores a file privately and returns its pathname (what the database keeps). */
export async function uploadFile(folder: FileFolder, file: File, season: string) {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new UploadError('Only photos (JPEG, PNG, WebP, HEIC) or PDFs can be uploaded');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('File is larger than 4 MB');
  }

  const safeSeason = season.replace(/[^a-zA-Z0-9-]/g, '') || 'unknown';
  const blob = await put(`${folder}/${safeSeason}/${crypto.randomUUID()}.${extension}`, file, {
    access: 'private',
    contentType: file.type,
  });
  return blob.pathname;
}

export async function deleteFile(pathname: string | null | undefined) {
  if (!pathname) return;
  try {
    await del(pathname);
  } catch (error) {
    // A leftover file is harmless; don't fail the request over it
    console.error('Failed to delete file:', pathname, error);
  }
}

export class UploadError extends Error {}
