import { test, expect } from '@playwright/test';

test('internal navigation preserves live audio and reinitializes the library', async ({ page }) => {
  await page.goto('/');
  await page.locator('h1').click();
  await expect.poll(() => page.locator('#ambience-music').evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(0);
  await page.evaluate(() => {
    (window as any).originalAudio = document.querySelector('#ambience-music');
    (window as any).pauses = 0;
    document.querySelector('#ambience-music')!.addEventListener('pause', () => (window as any).pauses++);
  });
  const start = await page.locator('#ambience-music').evaluate((el: HTMLAudioElement) => el.currentTime);
  await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Biblioteca', exact: true }).click();
  await page.getByLabel('Buscar livro').fill('Gênesis');
  await expect(page.locator('.book-item:visible')).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).originalAudio === document.querySelector('#ambience-music'))).toBe(true);
  expect(await page.locator('#ambience-music').evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(start);
  await page.locator('.spine[href="/ler/genesis/"]').click();
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Abrir Gênesis', exact: true }).click();
  await expect(page.locator('.folio-page[data-visible="true"] .note-marker').first()).toContainText('nota');
  await page.getByRole('link', { name: '← Biblioteca', exact: true }).click();
  await page.getByLabel('Buscar livro').fill('Salmos');
  await expect(page.locator('.book-item:visible')).toHaveCount(1);
  // A hidden tab must not trigger an application-level pause or restart.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => (window as any).pauses)).toBe(0);
  expect(await page.locator('#ambience-music').evaluate((el: HTMLAudioElement) => el.paused)).toBe(false);
  await page.getByRole('button', { name: 'Áudio', exact: true }).click();
  await page.getByRole('button', { name: 'Desligar som ambiente' }).click();
  await expect.poll(() => page.locator('#ambience-music').evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
});
