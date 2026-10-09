// Rebuild an exported catalog in an isolated temporary project; leave source content unchanged.
import { cp, mkdtemp, readFile, writeFile, mkdir, symlink, stat, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { exportBundle } from '../src/lib/admin/archive.ts';
import type { SiteContent } from '../src/lib/types.ts';

const source = resolve('.');
const temporary = await mkdtemp(join(tmpdir(), 'woodwork-publish-'));
try {
  const content: SiteContent = JSON.parse(await readFile('src/lib/content/site.json', 'utf8'));
  content.products.push({ ...structuredClone(content.products[0]), id: 'publish-smoke-product', name: 'Published QA Piece', slug: 'published-qa-piece', price: 12345, featured: false, order: 100 });
  content.products.find(p => p.id === 'p-side')!.visible = false;
  const archive = await exportBundle({ content, assets: {} }, async path => new Blob([new Uint8Array(await readFile(`static${path}`))]));
  for (const path of ['src', 'static', 'scripts', 'package.json', 'vite.config.ts', 'tsconfig.json']) await cp(join(source, path), join(temporary, path), { recursive: true });
  await symlink(join(source, 'node_modules'), join(temporary, 'node_modules'), 'dir');
  await writeFile(join(temporary, 'export.zip'), archive);
  execFileSync(process.execPath, ['scripts/import-content.ts', 'export.zip'], { cwd: temporary, stdio: 'pipe' });
  execFileSync('npm', ['run', 'build'], { cwd: temporary, stdio: 'pipe' });
  const html = await readFile(join(temporary, 'build/products/published-qa-piece/index.html'), 'utf8');
  if (!html.includes('Published QA Piece') || !html.includes('12,345')) throw new Error('Exported product content was not prerendered.');
  if (await stat(join(temporary, 'build/products/arc-side-table/index.html')).then(() => true).catch(() => false)) throw new Error('A hidden product was prerendered.');
  console.log('Publishing smoke check passed: exported content rebuilt, new product URL rendered, hidden product omitted.');
} finally { await rm(temporary, { recursive: true, force: true }); }
