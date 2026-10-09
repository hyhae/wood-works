import { zip, unzip, strToU8, strFromU8 } from 'fflate';
import { assetPaths } from '../catalog.ts';
import type { Draft } from '../types';
import { validateContent } from './validation.ts';

export const CONTENT_FILE = 'src/lib/content/site.json';
const MAX_BYTES = 100 * 1024 * 1024;
const mediaName = /^static\/media\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/;
function validImage(bytes: Uint8Array, extension: string) {
  if (extension === 'webp') return bytes.length > 12 && strFromU8(bytes.slice(0, 4)) === 'RIFF' && strFromU8(bytes.slice(8, 12)) === 'WEBP';
  if (extension === 'png') return bytes.length > 8 && bytes[0] === 137 && strFromU8(bytes.slice(1, 4)) === 'PNG';
  return bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}
export async function exportBundle(draft: Draft, fetchAsset: (path: string) => Promise<Blob>): Promise<Uint8Array> {
  const content = validateContent(draft.content);
  const files: Record<string, Uint8Array> = { [CONTENT_FILE]: strToU8(JSON.stringify(content, null, 2) + '\n') };
  let total = files[CONTENT_FILE].length;
  for (const path of assetPaths(content)) {
    const blob = draft.assets[path] || await fetchAsset(path);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!validImage(bytes, path.split('.').pop()!)) throw new Error(`Image is missing or invalid: ${path}`);
    total += bytes.length;
    if (total > MAX_BYTES) throw new Error('The export exceeds 100 MB. Reduce the number or size of images.');
    files[`static${path}`] = bytes;
  }
  return new Promise((resolve, reject) => zip(files, { level: 0 }, (error, result) => error ? reject(error) : resolve(result)));
}
export async function importBundle(bytes: Uint8Array): Promise<Draft> {
  if (bytes.length > MAX_BYTES) throw new Error('Choose a ZIP smaller than 100 MB.');
  let total = 0; let rejected = '';
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => unzip(bytes, {
    filter(file) {
      total += file.originalSize;
      if (total > MAX_BYTES) { rejected = 'The uncompressed ZIP exceeds 100 MB.'; return false; }
      if (file.name !== CONTENT_FILE && !mediaName.test(file.name)) { rejected = `Unexpected file in ZIP: ${file.name}`; return false; }
      return true;
    }
  }, (error, result) => error ? reject(new Error('Could not open this ZIP. Use a Woodwork export.')) : resolve(result)));
  if (rejected) throw new Error(rejected);
  if (!files[CONTENT_FILE]) throw new Error(`ZIP is missing ${CONTENT_FILE}.`);
  let raw: unknown;
  try { raw = JSON.parse(strFromU8(files[CONTENT_FILE])); } catch { throw new Error('The content JSON is invalid.'); }
  const content = validateContent(raw);
  const assets: Record<string, Blob> = {};
  for (const path of assetPaths(content)) {
    const image = files[`static${path}`];
    const extension = path.split('.').pop()!;
    if (!image || !validImage(image, extension)) throw new Error(`ZIP is missing a valid image: ${path}`);
    assets[path] = new Blob([new Uint8Array(image)], { type: extension === 'webp' ? 'image/webp' : extension === 'png' ? 'image/png' : 'image/jpeg' });
  }
  return { content, assets };
}
