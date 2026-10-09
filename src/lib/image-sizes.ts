export function imageSrcset(src: string, images: Record<string, string>) {
  if (!src || images[src]) return undefined;
  return [480, 960, 1600].map(width => `${src.replace(/\.([^.]+)$/, `-$1-${width}.webp`)} ${width}w`).join(', ');
}
