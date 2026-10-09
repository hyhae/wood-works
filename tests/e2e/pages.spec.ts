import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import type { SiteContent } from '../../src/lib/types';
import { assetPaths, catalogProducts } from '../../src/lib/catalog';

const basePath = process.env.BASE_PATH || '';
const published = JSON.parse(readFileSync('src/lib/content/site.json', 'utf8')) as SiteContent;
const sitePath = (path: string) => `${basePath}${path}`;
const product = catalogProducts(published)[0];

test('Pages deployment loads images, navigation, filters, and direct URLs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  for (const route of ['/', '/products/', '/about/', '/contact/', `/products/${product.slug}/`]) {
    await page.goto(sitePath(route));
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.site-header .wordmark')).toHaveAttribute('href', sitePath('/'));
    const images = await page.locator('main img').evaluateAll(elements =>
      Promise.all(elements.map(async element => {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        await image.decode().catch(() => {});
        return { src: image.currentSrc, loaded: image.naturalWidth > 0 };
      }))
    );
    for (const image of images) {
      expect(image.loaded, image.src).toBe(true);
      expect(new URL(image.src).pathname).toMatch(new RegExp(`^${basePath}/media/`));
    }
  }

  await page.getByRole('link', { name: 'Back to collection' }).click();
  await page.getByLabel('Sort by').selectOption('price-asc');
  await expect(page).toHaveURL(new RegExp(`${basePath}/products/\\?sort=price-asc$`));
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About us', exact: true }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${sitePath('/about/')}`);
  expect(errors).toEqual([]);
});

test('Pages CMS previews and exports original assets with portable ZIP paths', async ({ page }) => {
  await page.goto(sitePath('/admin/'));
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to website' })).toHaveAttribute('href', sitePath('/'));
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
  await expect(page.locator('.admin-product-row img').first()).toHaveAttribute('src', sitePath(product.images[0].src));

  await page.getByRole('button', { name: new RegExp(`^${product.name}`) }).click();
  await expect(page.locator('.image-picker-preview img').first()).toHaveAttribute('src', sitePath(product.images[0].src));
  await page.getByRole('link', { name: 'Preview saved product' }).click();
  await expect(page.locator('h1')).toHaveText(product.name);
  await expect(page.locator('.gallery-main img')).toHaveAttribute('src', sitePath(product.images[0].src));
  await page.getByRole('link', { name: 'Back to editor' }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${sitePath('/admin/')}`);

  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export content ZIP' }).click();
  const download = await downloadPromise;
  const files = unzipSync(await readFile((await download.path())!));
  expect(Object.keys(files).sort()).toEqual(['src/lib/content/site.json', ...assetPaths(published).map(path => `static${path}`)].sort());
  for (const path of assetPaths(published)) {
    expect(files[`static${path}`]).toEqual(new Uint8Array(await readFile(`static${path}`)));
  }
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${sitePath('/admin/')}`);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});
