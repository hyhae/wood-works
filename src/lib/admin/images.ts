export async function prepareImage(file: File): Promise<{ src: string; blob: Blob }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Choose an image smaller than 25 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened. Choose a valid image file.'); });
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not resize this image.')), 'image/webp', 0.86));
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    return { src: `/media/${crypto.randomUUID()}.${extension}`, blob };
  } finally { bitmap.close(); }
}
