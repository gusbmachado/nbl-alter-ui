import { test, expect, type Page } from '@playwright/test';
const visibleText = (page: Page) => page.locator('.folio-page[data-visible="true"] .verse-text');
async function ready(page: Page) { await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true'); }
test.beforeEach(async ({ page }) => {
  // Deterministic offline fallback typography; font loading is separately supported by reflow.
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
});
test('catálogo, capas fornecidas, virada real e capítulos no mesmo tomo', async ({ page, request }) => {
  await page.goto('/biblioteca/');
  await expect(page.locator('.book-item')).toHaveCount(66);
  await page.getByLabel('Buscar livro').fill('Gênesis');
  await expect(page.locator('.book-item:visible')).toHaveCount(1);
  await page.goto('/ler/genesis/'); await ready(page);
  await expect(page.locator('.folio-front img')).toHaveAttribute('src', '/img/tora-capa.jpg');
  await expect(page.locator('.stf__wrapper')).toHaveCount(1);
  await page.getByRole('button', { name: 'Abrir Gênesis', exact: true }).click();
  await expect(visibleText(page).first()).toContainText('Na encabeçadura do cria');
  await page.getByRole('button', { name: 'Índice', exact: true }).click();
  await page.getByLabel('Capítulo', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Voltar à leitura' }).click();
  await expect(page.getByLabel('Capítulo', { exact: true })).toHaveValue('3');
  await expect(visibleText(page).filter({ hasText: 'O serpe.' })).toHaveCount(1);
  expect((await request.get('/dados/genesis/4.json')).status()).toBe(404);
});
test('notas, filtros, Escape e retorno do foco', async ({ page }) => {
  await page.goto('/ler/salmos/?capitulo=1&verso=1'); await ready(page);
  const marker = page.getByRole('button', { name: '30 notas do verso 1', exact: true });
  await marker.click();
  await expect(page.locator('.note-entry')).toHaveCount(30);
  await page.getByText('Buscar e filtrar notas', { exact: true }).click();
  await page.getByLabel('Categoria', { exact: true }).selectOption('philology');
  await expect(page.locator('.note-entry')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(marker).toBeFocused();
});
test('texto integral, fonte maior, reflow móvel e retomada semântica', async ({ page, request }) => {
  const source = await (await request.get('/dados/salmos/1.json')).json();
  await page.goto('/ler/salmos/?capitulo=1&verso=3'); await ready(page);
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Aumentar fonte' }).click();
  await page.getByLabel('Tema', { exact: true }).selectOption('noturno');
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await expect(page.getByLabel('Ir ao verso', { exact: true })).toHaveValue('3');
  for (const verse of source.verses) {
    const parts = await page.locator(`.folio-page .verse-text[data-verse="${verse.number}"]`).allTextContents();
    expect(parts.join('')).toBe(verse.text);
  }
  expect(await page.locator('.folio-text').evaluateAll(nodes => nodes.every(n => n.scrollHeight <= n.clientHeight + 1))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Fechar tomo', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar leitura', exact: false }).click();
  await expect(page.getByLabel('Ir ao verso', { exact: true })).toHaveValue('3');
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Estudo', exact: true }).click();
  await expect(page.locator('.study-reading')).toBeVisible();
  await expect(page.locator('.study-reading .verse-text[data-verse="3"]')).toHaveText(source.verses[2].text);
});
test('armazenamento bloqueado, áudio ausente e movimento reduzido', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Bloqueado'); };
    Storage.prototype.getItem = () => { throw new Error('Bloqueado'); };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/audio/**', route => route.abort());
  await page.goto('/ler/salmos/'); await ready(page);
  await page.getByRole('button', { name: 'Abrir Salmos', exact: true }).click();
  await expect(visibleText(page).first()).toBeVisible();
  await page.getByRole('button', { name: 'Próxima →', exact: true }).click();
  await expect(visibleText(page).first()).toBeVisible();
  await expect(page.locator('.flip-hint')).toContainText('movimento reduzido ativo');
});
test('home usa imagem 3D íntegra e navegação para biblioteca', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-codex-object img')).toHaveAttribute('src', '/img/3d.png');
  await expect(page.locator('.hero-codex-layer')).toHaveCount(3);
  await page.locator('.hero-codex-stage').click();
  await expect(page).toHaveURL(/biblioteca/);
});
