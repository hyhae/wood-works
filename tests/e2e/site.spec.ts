import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';

async function login(page: Page) {
  await page.goto('/admin/');
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
}

test('public catalog navigation, filters, sort, search, and direct product links', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('A natural place to belong.');
  await page.getByRole('link', { name: 'Explore products', exact: true }).click();
  await page.getByRole('navigation', { name: 'Product categories' }).getByRole('link', { name: 'Dining', exact: true }).click();
  await expect(page).toHaveURL(/category=dining/); await expect(page.locator('.product-card')).toHaveCount(2);
  await page.getByLabel('Type', { exact: true }).selectOption('dining-chairs'); await expect(page.locator('.product-card')).toHaveCount(1);
  await page.reload(); await expect(page.getByLabel('Type', { exact: true })).toHaveValue('dining-chairs');
  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/products/');
  await page.getByLabel('Sort by').selectOption('price-asc'); await expect(page).toHaveURL(/sort=price-asc/); await expect(page.locator('.product-card h3').first()).toHaveText('Grain Bowl Set');
  await page.getByLabel('Search products').fill('no-such-product'); await page.getByRole('button', { name: 'Search', exact: true }).click(); await expect(page.getByRole('heading', { name: 'No pieces found.' })).toBeVisible();
  await page.goto('/products/forma-coffee-table/'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forma Coffee Table'); await expect(page.locator('.detail-price')).toContainText('18,500');
  await page.goto('/products/missing/'); await expect(page.getByRole('heading', { level: 1 })).toContainText('This page has moved on.');
});

test('demo login guards direct previews, handles errors, refresh, and logout', async ({ page }) => {
  await page.goto('/admin/preview/?view=products'); await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Username', { exact: true }).fill('admin'); await page.getByLabel('Password', { exact: true }).fill('wrong'); await page.getByRole('button', { name: 'Sign in' }).click(); await expect(page.getByRole('alert')).toHaveText('Incorrect username or password.');
  await page.getByLabel('Password', { exact: true }).fill('admin123'); await page.getByRole('button', { name: 'Sign in' }).click(); await expect(page.locator('.preview-banner')).toBeVisible();
  await page.goto('/admin/'); await expect(page.getByRole('button', { name: 'New product' })).toBeVisible(); await page.reload(); await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click(); await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.goto('/admin/preview/'); await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('draft editing, inquiries, uploads, preview, export and import leave public content unchanged', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /^Forma Coffee Table/ }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Edited Forma Table');
  await page.getByLabel('Price (EGP)', { exact: true }).fill('20000');
  await page.locator('#gallery-upload').setInputFiles('static/media/side.webp');
  await expect(page.getByLabel('Image 2 alternative text')).toBeVisible();
  await page.getByRole('button', { name: 'Save product', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload(); await expect(page.getByRole('button', { name: /^Edited Forma Table/ })).toBeVisible();
  await page.getByRole('button', { name: 'Site Content', exact: true }).click();
  await page.getByLabel('WhatsApp number', { exact: true }).fill('+20 100 123 4567'); await page.getByLabel('Email address', { exact: true }).fill('hello@example.com');
  await page.getByRole('button', { name: 'Save site content' }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.goto('/admin/preview/?view=product&slug=forma-coffee-table');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Edited Forma Table'); await expect(page.locator('.detail-price')).toContainText('20,000');
  await expect(page.getByRole('link', { name: 'Inquire on WhatsApp' })).toHaveAttribute('href', /wa.me\/201001234567\?text=.*Edited%20Forma%20Table/);
  await page.getByRole('button', { name: /View image 2/ }).click(); await expect(page.locator('.gallery-main img')).toHaveAttribute('src', /^blob:/);
  await page.goto('/products/forma-coffee-table/'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forma Coffee Table'); await expect(page.locator('.detail-price')).toContainText('18,500');
  await page.goto('/admin/'); await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export content ZIP' }).click(); const download = await downloadPromise;
  const downloaded = await readFile((await download.path())!); expect(downloaded.length).toBeGreaterThan(1000);
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset local draft' }).click(); await expect(page.getByRole('status')).toContainText('reset');
  await page.locator('#content-import').setInputFiles({ name: 'restore.zip', mimeType: 'application/zip', buffer: downloaded }); await expect(page.getByRole('status')).toContainText('Import saved');
  const invalid = zipSync({ 'src/lib/content/site.json': strToU8('{}') });
  await page.locator('#content-import').setInputFiles({ name: 'bad.zip', mimeType: 'application/zip', buffer: Buffer.from(invalid) }); await expect(page.getByRole('status')).toContainText('existing draft is unchanged');
  await page.getByRole('button', { name: 'Products', exact: true }).click(); await expect(page.getByRole('button', { name: /^Edited Forma Table/ })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click(); await login(page); await expect(page.getByRole('button', { name: /^Edited Forma Table/ })).toBeVisible();
});

test('referenced category deletion is blocked and new products validate prices and slugs', async ({ page }) => {
  await login(page); await page.getByRole('button', { name: 'Categories', exact: true }).click(); await page.getByRole('button', { name: 'Delete Dining category', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Reassign');
  await page.getByRole('button', { name: 'Products', exact: true }).click(); await page.getByRole('button', { name: /^Arc Side Table/ }).click();
  await page.getByLabel('URL slug', { exact: true }).fill('forma-coffee-table'); await page.getByRole('button', { name: 'Save product' }).click(); await expect(page.getByRole('alert')).toContainText('Duplicate URL slug');
  await page.getByLabel('URL slug', { exact: true }).fill('arc-side-table'); await page.getByLabel('Price (EGP)', { exact: true }).fill('0'); await page.getByRole('button', { name: 'Save product' }).click(); expect(await page.getByLabel('Price (EGP)', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
});

test('storefront and admin are accessible in both themes and fit mobile screens', async ({ page }) => {
  for (const route of ['/', '/products/', '/about/', '/contact/', '/products/forma-coffee-table/', '/admin/']) {
    await page.goto(route); await page.locator('h1').waitFor();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(results.violations, `${route} ${theme}`).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/products/', '/about/', '/contact/', '/products/forma-coffee-table/', '/admin/']) {
    await page.goto(route); await page.locator('h1').waitFor(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${route}`).toBe(true);
  }
  await page.goto('/'); await page.getByRole('button', { name: 'Open navigation' }).click(); await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About us' }).click(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Furniture with a natural');
});

test('creates categories and products, checks CMS accessibility, and hides/deletes local entries', async ({ page }) => {
  await login(page);
  for (const section of ['Products', 'Categories', 'Site Content', 'Import / Export']) {
    await page.getByRole('button', { name: section, exact: true }).click();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(result.violations, `${section} ${theme}`).toEqual([]);
    }
  }
  await page.getByRole('button', { name: 'Categories', exact: true }).click(); await page.getByRole('button', { name: 'Add category', exact: true }).click();
  const category = page.locator('.category-editor').last();
  await category.getByLabel('Category name', { exact: true }).fill('Workspace'); await category.getByLabel('Category slug', { exact: true }).fill('workspace');
  await category.getByRole('button', { name: 'Add subcategory', exact: true }).click();
  await category.getByLabel('Name', { exact: true }).fill('Desks'); await category.getByLabel('Slug', { exact: true }).fill('desks');
  await page.getByRole('button', { name: 'Save categories', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.getByRole('button', { name: 'Products', exact: true }).click(); await page.getByRole('button', { name: 'New product', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Writing Desk'); await page.getByLabel('Price (EGP)', { exact: true }).fill('15000');
  await page.getByRole('checkbox', { name: 'Desks', exact: true }).check(); await page.locator('#gallery-upload').setInputFiles('static/media/dining.webp');
  await expect(page.getByLabel('Image 1 alternative text')).toBeVisible();
  await page.getByRole('button', { name: 'Save product', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(result.violations).toEqual([]);
  await page.getByRole('link', { name: 'Preview saved product' }).click(); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing Desk');
  await page.goto('/admin/preview/?view=products&category=workspace'); await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto('/admin/'); await page.getByRole('button', { name: /^Writing Desk/ }).click(); await page.getByRole('checkbox', { name: 'Visible in catalog' }).uncheck();
  await page.getByRole('button', { name: 'Save product', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.goto('/admin/preview/?view=products&category=workspace'); await expect(page.getByRole('heading', { name: 'No pieces found.' })).toBeVisible();
  await page.goto('/admin/'); page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Writing Desk', exact: true }).click(); await expect(page.getByRole('button', { name: /^Writing Desk/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Categories', exact: true }).click(); await page.getByRole('button', { name: 'Delete Workspace category', exact: true }).click();
  await page.getByRole('button', { name: 'Save categories', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toHaveCount(0);
});
