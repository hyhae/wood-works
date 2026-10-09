import { readFile, writeFile, stat, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { exportBundle, importBundle, CONTENT_FILE } from '../src/lib/admin/archive.ts';
import { validateContent, readableError } from '../src/lib/admin/validation.ts';

const MAX_BYTES = 100 * 1024 * 1024;

// Merge only validated content files. Never replace src/ or static/ directories.
export async function importContent(input: string, projectRoot: string) {
  const source = resolve(input);
  const root = resolve(projectRoot);
  if (!(await stat(resolve(root, 'src/app.html')).catch(() => null))?.isFile()) {
    throw new Error('The destination is missing src/app.html. Restore the application source before importing content.');
  }
  let bytesRead = 0;
  async function limitedRead(path: string) {
    const info = await stat(path);
    if (!info.isFile()) throw new Error(`Expected a file: ${path}`);
    bytesRead += info.size;
    if (bytesRead > MAX_BYTES) throw new Error('The content export exceeds 100 MB.');
    return new Uint8Array(await readFile(path));
  }
  const info = await stat(source);
  const bytes = info.isDirectory()
    ? await exportBundle({
        content: validateContent(JSON.parse(new TextDecoder().decode(await limitedRead(resolve(source, CONTENT_FILE))))),
        assets: {}
      }, async path => new Blob([await limitedRead(resolve(source, `static${path}`))]))
    : await limitedRead(source);
  const draft = await importBundle(bytes);

  async function replaceFile(path: string, data: string | Uint8Array) {
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, data);
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  for (const [path, image] of Object.entries(draft.assets)) {
    await replaceFile(resolve(root, `static${path}`), new Uint8Array(await image.arrayBuffer()));
  }
  await replaceFile(resolve(root, CONTENT_FILE), JSON.stringify(draft.content, null, 2) + '\n');
  return draft.content;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (!process.argv[2] || process.argv.length !== 3) throw new Error('Usage: npm run import:content -- <export.zip or extracted export directory>');
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const content = await importContent(process.argv[2], root);
    console.log(`Imported ${content.products.length} products and ${content.categories.length} categories. Application source preserved. Run npm run build to publish the changes.`);
  } catch (error) {
    console.error(readableError(error));
    process.exitCode = 1;
  }
}
