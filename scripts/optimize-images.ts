import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { assetPaths } from '../src/lib/catalog.ts';
import type { SiteContent } from '../src/lib/types.ts';
const content: SiteContent = JSON.parse(await readFile('src/lib/content/site.json', 'utf8'));
for (const src of assetPaths(content)) {
  for (const width of [480, 960, 1600]) {
    const target = src.replace(/\.([^.]+)$/, `-$1-${width}.webp`);
    await sharp(`static${src}`).resize({ width }).webp({ quality: 75 }).toFile(`static${target}`);
  }
}
console.log(`Responsive image sizes ready for ${assetPaths(content).length} images.`);
