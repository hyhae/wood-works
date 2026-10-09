import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateContent, readableError } from '../src/lib/admin/validation.ts';
import { assetPaths } from '../src/lib/catalog.ts';
try {
  const content = validateContent(JSON.parse(await readFile('src/lib/content/site.json', 'utf8')));
  for (const path of assetPaths(content)) {
    const info = await stat(resolve('static', path.slice(1))).catch(() => { throw new Error(`Missing asset: static${path}`); });
    if (!info.isFile()) throw new Error(`Not an image file: ${path}`);
  }
  console.log(`Content valid: ${content.products.length} products, ${content.categories.length} categories.`);
} catch (error) { console.error(readableError(error)); process.exitCode = 1; }
