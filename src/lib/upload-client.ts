// Browser-side helpers for uploading to /api/files

/** Shrinks phone photos to ~1600px JPEG before upload; anything it can't decode is sent as-is. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

/** Uploads to private storage (photos shrunk first) and returns the stored pathname. */
export async function uploadFile(file: File, folder: 'receipts' | 'events') {
  if (file.type === 'application/pdf' && file.size > 4 * 1024 * 1024) {
    throw new Error('PDF is larger than 4 MB');
  }
  const body = new FormData();
  body.append('file', await compressImage(file));
  body.append('folder', folder);
  const response = await fetch('/api/files', { method: 'POST', body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Upload failed');
  return result.pathname as string;
}

/** URL a signed-in user can open a stored file at. */
export function fileUrl(pathname: string) {
  return `/api/files/${pathname}`;
}
