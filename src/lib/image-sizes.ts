import { asset } from '$app/paths';
import type { AssetPath } from '$app/types';

export function imageSrc(src: string, images: Record<string, string> = {}) {
  if (!src) return '';
  return images[src] || asset(src as AssetPath);
}

export function imageSrcset(src: string, images: Record<string, string>) {
  if (!src || images[src]) return undefined;
  return [480, 960, 1600].map(width => `${imageSrc(src.replace(/\.([^.]+)$/, `-$1-${width}.webp`))} ${width}w`).join(', ');
}
