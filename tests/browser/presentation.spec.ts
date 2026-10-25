import { test, expect } from '@playwright/test';
test('apresentação, gesto de virar e composição com fonte ampliada', async ({ page }, info) => {
  await page.goto('/');
  await page.screenshot({ path: info.outputPath('home.png'), fullPage: true });
  await page.goto('/ler/genesis/?capitulo=1&verso=1');
  const shell = page.locator('.flipbook-shell');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath('reader.png'), fullPage: true });
  if (info.project.name === 'desktop') {
    const leaf = page.locator('.folio-page[data-visible="true"]').last();
    await leaf.scrollIntoViewIfNeeded();
    const box = (await leaf.boundingBox())!;
    const before = await page.locator('.codex-pagination p').textContent();
    await page.mouse.move(box.x + box.width - 5, box.y + box.height - 10);
    await page.mouse.down();
    await page.mouse.move(box.x - box.width / 2, box.y + box.height / 2, { steps: 20 });
    await page.mouse.up();
    await expect(page.locator('.codex-pagination p')).not.toHaveText(before!);
  }
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Aumentar fonte', exact: true }).click();
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await expect(shell).toHaveAttribute('data-ready', 'true');
  expect(await page.locator('.folio-page[data-visible="true"] .folio-text').evaluateAll(nodes => nodes.length > 0 && nodes.every(n => n.scrollHeight <= n.clientHeight + 1))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
