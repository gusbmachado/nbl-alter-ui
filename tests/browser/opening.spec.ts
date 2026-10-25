import { test, expect } from '@playwright/test';

test('capa inteira abre o tomo após resize que mantém o tamanho das folhas', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/ler/genesis/');
  const shell = page.locator('.flipbook-shell');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await page.setViewportSize({ width: 1200, height: 980 });
  await page.locator('.folio-front img').click();
  await expect(page.locator('.folio-page[data-visible="true"] .verse-text').first()).toBeVisible();
  await expect(page.locator('.codex-pagination p')).toContainText('Capítulo 1');
  await page.getByRole('button', { name: 'Ajustes de leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Fechar tomo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir Gênesis', exact: true })).toBeVisible();
});

test('editor tem rota própria, configuração e erro de rede visível', async ({ page, request }) => {
  const config = await request.get('/admin/config.yml');
  expect(config.status()).toBe(200);
  expect(await config.text()).toContain('collections:');
  await page.route('https://unpkg.com/**', route => route.abort());
  const response = await page.goto('/admin/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('status')).toContainText('Não foi possível baixar o editor');
  await expect(page.getByRole('link', { name: '← Voltar à biblioteca' })).toHaveAttribute('href', '/biblioteca/');
});
