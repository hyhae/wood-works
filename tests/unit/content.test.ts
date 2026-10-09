import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';
import { published } from '../../src/lib/published';
import { assetPaths, catalogProducts, categoryReferences, filterProducts, inquiryLinks, priceLabel } from '../../src/lib/catalog';
import { validateContent } from '../../src/lib/admin/validation';
import { CONTENT_FILE, exportBundle, importBundle } from '../../src/lib/admin/archive';
const sample = () => structuredClone(published);

describe('catalog behavior', () => {
  it('shares a dining chair across both category branches without duplicates', () => {
    expect(filterProducts(published, { category: 'dining', subcategory: 'dining-chairs' }).map(p => p.id)).toEqual(['p-chair']);
    expect(filterProducts(published, { category: 'chairs' }).map(p => p.id)).toEqual(['p-chair']);
    expect(catalogProducts(published).filter(p => p.id === 'p-chair')).toHaveLength(1);
  });
  it('searches materials, returns empty results, and sorts prices', () => {
    expect(filterProducts(published, { q: 'not-a-product' })).toHaveLength(0);
    expect(filterProducts(published, { q: 'WALNUT', sort: 'price-asc' })[0].id).toBe('p-bowls');
    expect(filterProducts(published, { sort: 'price-desc' })[0].id).toBe('p-bed');
    expect(filterProducts(published, { sort: 'name' })[0].name).toBe('Arc Side Table');
  });
  it('hides products whose visible assignments disappear, retaining shared assignments', () => {
    const content = sample(); content.categories.find(c => c.id === 'dining')!.visible = false;
    expect(catalogProducts(content).some(p => p.id === 'p-dining')).toBe(false);
    expect(catalogProducts(content).some(p => p.id === 'p-chair')).toBe(true);
    content.products.find(p => p.id === 'p-chair')!.visible = false;
    expect(catalogProducts(content).some(p => p.id === 'p-chair')).toBe(false);
  });
  it('finds referenced products before category deletion', () => { expect(categoryReferences(published, 'dining').map(p => p.id)).toEqual(['p-dining', 'p-chair']); });
  it('formats EGP and encodes product inquiry messages without fake contact links', () => {
    expect(priceLabel(18500, 'EGP')).toContain('18,500');
    expect(inquiryLinks(published)).toEqual({ whatsapp: '', email: '', phone: '' });
    const content = sample(); Object.assign(content.settings, { whatsapp: '+20 100 123 4567', email: 'hello@example.com', phone: '+20 100 123 4567' });
    const links = inquiryLinks(content, content.products[0], 'https://example.com/products/forma-coffee-table/');
    expect(links.whatsapp).toMatch(/^https:\/\/wa.me\/201001234567\?text=/);
    expect(decodeURIComponent(links.whatsapp)).toContain('Forma Coffee Table.\nhttps://example.com/products/forma-coffee-table/');
    expect(links.email).toContain('mailto:hello@example.com?subject='); expect(links.phone).toBe('tel:+201001234567');
  });
});

describe('content validation', () => {
  it('accepts the sample catalog and shared subcategory slugs in different parents', () => { expect(validateContent(sample())).toEqual(published); });
  it.each([
    ['zero price', (c: ReturnType<typeof sample>) => c.products[0].price = 0],
    ['duplicate product slug', (c: ReturnType<typeof sample>) => c.products[1].slug = c.products[0].slug],
    ['duplicate category ID', (c: ReturnType<typeof sample>) => c.categories[1].id = c.categories[0].id],
    ['missing parent', (c: ReturnType<typeof sample>) => c.subcategories[0].categoryId = 'missing'],
    ['missing assignment', (c: ReturnType<typeof sample>) => c.products[0].subcategoryIds = ['missing']],
    ['missing image', (c: ReturnType<typeof sample>) => c.products[0].images = []],
    ['missing alt text', (c: ReturnType<typeof sample>) => c.products[0].images[0].alt = ''],
    ['external asset path', (c: ReturnType<typeof sample>) => c.settings.heroImage = 'https://example.com/image.jpg'],
    ['unsafe social URL', (c: ReturnType<typeof sample>) => c.settings.facebook = 'javascript:alert(1)'],
    ['invalid currency', (c: ReturnType<typeof sample>) => c.settings.currency = 'XYZ']
  ])('rejects %s', (_, change) => { const content = sample(); change(content); expect(() => validateContent(content)).toThrow(); });
});

describe('portable ZIP workflow', () => {
  it('exports and restores all content and image bytes', async () => {
    const paths: string[] = [];
    const bytes = await exportBundle({ content: sample(), assets: {} }, async path => { paths.push(path); return new Blob([new Uint8Array(await readFile(`static${path}`))]); });
    const restored = await importBundle(bytes);
    expect(restored.content).toEqual(published); expect(paths).toEqual(assetPaths(published));
    for (const path of paths) expect(new Uint8Array(await restored.assets[path].arrayBuffer())).toEqual(new Uint8Array(await readFile(`static${path}`)));
    const exportedAgain = await exportBundle(restored, async () => { throw new Error('Restored assets must be self-contained.'); });
    expect((await importBundle(exportedAgain)).content).toEqual(published);
  });
  it('rejects missing images, malformed JSON, unsafe paths, and corrupt ZIPs', async () => {
    await expect(importBundle(zipSync({ [CONTENT_FILE]: strToU8(JSON.stringify(published)) }))).rejects.toThrow('missing a valid image');
    await expect(importBundle(zipSync({ [CONTENT_FILE]: strToU8('{nope') }))).rejects.toThrow('JSON is invalid');
    await expect(importBundle(zipSync({ '../escape.txt': strToU8('bad') }))).rejects.toThrow('Unexpected file');
    await expect(importBundle(new Uint8Array([1, 2, 3]))).rejects.toThrow('Could not open');
  });
  it('rejects invalid data and missing files during export', async () => {
    const content = sample(); content.products[0].price = -1;
    await expect(exportBundle({ content, assets: {} }, async () => new Blob())).rejects.toThrow();
    await expect(exportBundle({ content: sample(), assets: {} }, async () => new Blob(['not an image']))).rejects.toThrow('missing or invalid');
  });
});
