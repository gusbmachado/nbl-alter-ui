import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('edição local completa: verso, nota, prévia, exportação, restauração e importação', async ({ page, request }) => {
  await page.goto('/experimentar/genesis/?capitulo=1');
  const original = (await (await request.get('/dados/genesis/1.json')).json()).verses[0].text;
  const text = page.getByLabel('Texto do verso', { exact: true });
  await expect(text).toHaveValue(original);
  await text.fill('Verso alterado somente para a demonstração.');
  await page.getByRole('button', { name: 'Adicionar nota', exact: true }).click();
  await page.getByLabel('Comentário', { exact: true }).last().fill('Minha nota de demonstração.');
  await expect(page.locator('.editor-save')).toHaveText('Rascunho salvo neste navegador');
  await page.reload();
  await expect(text).toHaveValue('Verso alterado somente para a demonstração.');
  await page.getByRole('button', { name: 'Pré-visualizar no livro' }).click();
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.folio-page[data-visible="true"] .verse-text').first()).toContainText('Verso alterado');
  await page.getByRole('button', { name: '11 notas do verso 1', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Minha nota de demonstração.');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '← Voltar à edição' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar rascunho' }).click();
  const download = await downloadPromise;
  const buffer = await readFile((await download.path())!);
  expect(JSON.parse(buffer.toString()).chapters[0].verses[0].text).toContain('Verso alterado');
  await page.getByRole('button', { name: 'Restaurar amostra', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, restaurar', exact: true }).click();
  await expect(text).toHaveValue(original);
  await page.getByLabel('Arquivo de rascunho').setInputFiles({ name: 'rascunho.json', mimeType: 'application/json', buffer });
  await expect(text).toHaveValue('Verso alterado somente para a demonstração.');
  const unchanged = await (await request.get('/dados/genesis/1.json')).json();
  expect(unchanged.verses[0].text).toBe(original);
  await page.goto('/ler/genesis/?capitulo=1');
  await expect(page.locator('.folio-page[data-visible="true"] .verse-text').first()).toContainText('Na encabeçadura');
});

test('arquivo inválido preserva trabalho; armazenamento bloqueado permite prévia e exportação', async ({ page }) => {
  await page.addInitScript(() => { IDBFactory.prototype.open = () => { throw new Error('Bloqueado'); }; });
  await page.goto('/experimentar/genesis/');
  const text = page.getByLabel('Texto do verso', { exact: true });
  await text.fill('Rascunho mantido na sessão.');
  await expect(page.locator('.editor-save')).toContainText('armazenamento indisponível');
  await page.getByLabel('Arquivo de rascunho').setInputFiles({ name: 'invalido.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await expect(page.getByRole('alert').last()).toContainText('Arquivo incompatível');
  await expect(text).toHaveValue('Rascunho mantido na sessão.');
  await page.getByRole('button', { name: 'Pré-visualizar no livro' }).click();
  await expect(page.locator('.folio-page[data-visible="true"] .verse-text').first()).toContainText('Rascunho mantido');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar rascunho' }).click();
  expect((await download).suggestedFilename()).toBe('rascunho-genesis.json');
});


test('estante abre o livro diretamente e oficina permanece legível', async ({ page }, info) => {
  await page.goto('/biblioteca/');
  await page.getByLabel('Disponíveis para leitura').check();
  await expect(page.locator('.book-item:visible')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('biblioteca.png'), fullPage: true });
  await page.locator('.spine[href="/ler/genesis/"]').click();
  await expect(page).toHaveURL(/\/ler\/genesis\//);
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  await page.getByRole('link', { name: 'Experimentar edição ↗', exact: true }).click();
  await expect(page.getByLabel('Texto do verso', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('oficina.png'), fullPage: true });
});


test('prévia abre o verso editado no capítulo selecionado', async ({ page }) => {
  await page.goto('/experimentar/genesis/?capitulo=3&verso=2');
  await expect(page.getByRole('heading', { name: 'Capítulo 3 · verso 2', exact: true })).toBeVisible();
  await page.getByLabel('Texto do verso', { exact: true }).fill('Prévia contextual do verso dois.');
  await page.getByRole('button', { name: 'Pré-visualizar no livro' }).click();
  await expect(page.getByLabel('Capítulo', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Ir ao verso', { exact: true })).toHaveValue('2');
  await expect(page.locator('.folio-page[data-visible="true"] .verse-text').filter({ hasText: 'Prévia contextual' })).toHaveCount(1);
});
