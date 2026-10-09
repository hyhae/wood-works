import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unzipSync, zipSync, strToU8 } from 'fflate';
import { importContent } from '../../scripts/import-content.ts';
import { published } from '../../src/lib/published.ts';
import { exportBundle, CONTENT_FILE } from '../../src/lib/admin/archive.ts';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'woodwork-import-test-'));
  directories.push(directory);
  const project = join(directory, 'project');
  await mkdir(join(project, 'src/lib/content'), { recursive: true });
  await mkdir(join(project, 'static/media'), { recursive: true });
  await writeFile(join(project, 'src/app.html'), 'application template');
  await writeFile(join(project, 'src/lib/keep.ts'), 'export const preserved = true;');
  await writeFile(join(project, 'static/media/keep.webp'), 'unreferenced asset');
  await writeFile(join(project, CONTENT_FILE), JSON.stringify(published));
  const content = structuredClone(published);
  content.settings.businessName = 'Imported Woodwork';
  const archive = await exportBundle({ content, assets: {} }, async path => new Blob([new Uint8Array(await readFile(`static${path}`))]));
  return { directory, project, content, archive };
}

describe('project content import', () => {
  it.each(['zip', 'directory'])('merges a valid %s export without replacing application files', async format => {
    const { directory, project, content, archive } = await fixture();
    const source = join(directory, format === 'zip' ? 'export.zip' : 'extracted');
    if (format === 'zip') await writeFile(source, archive);
    else for (const [path, bytes] of Object.entries(unzipSync(archive))) {
      const destination = join(source, path);
      await mkdir(join(destination, '..'), { recursive: true });
      await writeFile(destination, bytes);
    }
    expect(await importContent(source, project)).toEqual(content);
    expect(JSON.parse(await readFile(join(project, CONTENT_FILE), 'utf8'))).toEqual(content);
    expect(await readFile(join(project, 'src/app.html'), 'utf8')).toBe('application template');
    expect(await readFile(join(project, 'src/lib/keep.ts'), 'utf8')).toBe('export const preserved = true;');
    expect(await readFile(join(project, 'static/media/keep.webp'), 'utf8')).toBe('unreferenced asset');
    for (const image of content.products.flatMap(product => product.images)) {
      expect(await readFile(join(project, `static${image.src}`))).toEqual(await readFile(`static${image.src}`));
    }
  });

  it('rejects invalid exports before changing existing content or images', async () => {
    const { directory, project, archive } = await fixture();
    const files = unzipSync(archive);
    delete files[Object.keys(files).find(path => path.startsWith('static/media/'))!];
    for (const [name, bytes] of [
      ['missing-image.zip', zipSync(files)],
      ['invalid-content.zip', zipSync({ [CONTENT_FILE]: strToU8('{}') })],
      ['unsafe-path.zip', zipSync({ '../escape.txt': strToU8('unexpected') })]
    ] as const) {
      const source = join(directory, name);
      await writeFile(source, bytes);
      await expect(importContent(source, project)).rejects.toThrow();
      expect(JSON.parse(await readFile(join(project, CONTENT_FILE), 'utf8'))).toEqual(published);
      expect(await readFile(join(project, 'static/media/keep.webp'), 'utf8')).toBe('unreferenced asset');
    }
  });
});
