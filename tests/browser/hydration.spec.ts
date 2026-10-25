import { test, expect } from '@playwright/test';

test('SSR and client hydration agree on direct and internal navigation', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => {
    if (/hydrat|server rendered HTML|didn't match/i.test(message.text())) warnings.push(message.text());
  });
  page.on('pageerror', error => warnings.push(error.message));
  await page.goto('/ler/genesis/');
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('link', { name: '← Biblioteca', exact: true }).click();
  await page.locator('.spine[href="/ler/salmos/"]').click();
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Ajustes de leitura' }).click();
  await page.getByRole('link', { name: 'Experimentar edição ↗', exact: true }).click();
  await expect(page.getByLabel('Texto do verso', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pré-visualizar no livro' }).click();
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  expect(warnings).toEqual([]);
});

test('hovering page corners does not expand the document or rebuild the book', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Corner hover requires a mouse.');
  await page.goto('/ler/genesis/?capitulo=1&verso=1');
  const shell = page.locator('.flipbook-shell');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
  await shell.scrollIntoViewIfNeeded();
  await page.evaluate(() => { (window as any).originalEngine = document.querySelector('.flip-engine'); });
  const dimensions = () => page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  const before = await dimensions();
  const leaf = page.locator('.folio-page[data-visible="true"]').last();
  const box = (await leaf.boundingBox())!;
  for (const y of [box.y + 4, box.y + box.height - 4]) {
    await page.mouse.move(box.x + box.width - 4, y);
    await expect.poll(dimensions).toEqual(before);
    await page.waitForTimeout(700); // Let the corner preview and ResizeObserver settle.
    expect(await dimensions()).toEqual(before);
    expect(await page.evaluate(() => document.querySelector('.flip-engine') === (window as any).originalEngine)).toBe(true);
    await page.mouse.move(0, 0);
  }
  const progress = await page.locator('.codex-pagination p').textContent();
  await page.getByRole('button', { name: 'Próxima →', exact: true }).click();
  await expect(page.locator('.codex-pagination p')).not.toHaveText(progress!);
});

test('saved preferences hydrate from a deterministic initial render', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nbl:preferences', JSON.stringify({ theme: 'noturno', font: 'literary', size: 24, sound: false, notes: false })));
  const messages: string[] = [];
  page.on('console', m => { if (/hydrat|didn't match/i.test(m.text())) messages.push(m.text()); });
  await page.goto('/ler/genesis/?capitulo=2&verso=3');
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.codex-reader')).toHaveClass(/theme-noturno/);
  expect(messages).toEqual([]);
});
