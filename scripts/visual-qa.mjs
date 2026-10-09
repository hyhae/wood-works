import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/'); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'qa/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 }); await page.screenshot({ path: 'qa/home-laptop.png' });
  await page.goto('http://127.0.0.1:4173/products/'); await page.screenshot({ path: 'qa/catalog-desktop.png', fullPage: true });
  await page.goto('http://127.0.0.1:4173/admin/');
  await page.getByLabel('Username', { exact: true }).fill('admin'); await page.getByLabel('Password', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.getByRole('button', { name: 'New product' }).waitFor();
  await page.screenshot({ path: 'qa/admin-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'qa/admin-mobile.png', fullPage: true });
  for (const [name, route] of [['home', '/'], ['catalog', '/products/']]) {
    await page.goto('http://127.0.0.1:4173' + route); await page.screenshot({ path: `qa/${name}-mobile.png`, fullPage: true });
  }
  console.log(JSON.stringify({ browserErrors: errors, screenshots: 'qa/' }));
} finally { await browser.close(); }
