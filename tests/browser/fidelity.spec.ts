import { test, expect } from '@playwright/test';

test('home tem capas e formulários demonstrativos; oficina retorna à passagem', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.collection-grid .binding-art')).toHaveCount(4);
  await expect(page.locator('.home-index,.presentation-nav')).toHaveCount(0);
  const form = page.getByRole('form', { name: 'Contato com o tradutor' });
  await form.getByLabel('Nome', { exact: true }).fill('Leitor de teste');
  await form.getByLabel('E-mail', { exact: true }).fill('teste@example.com');
  await form.getByLabel('Comentário ou mensagem').fill('Teste local');
  await form.getByRole('button').click();
  await expect(page.locator('#msg-form')).toContainText('Nada foi enviado');
  await page.getByText('Sugerir correção de uma passagem', { exact: true }).click();
  const correction = page.getByRole('form', { name: 'Sugestão de correção' });
  await correction.getByLabel('Livro', { exact: true }).selectOption({ label: 'Gênesis' });
  await correction.getByLabel('Capítulo', { exact: true }).fill('2');
  await correction.getByLabel('Versículo', { exact: true }).fill('3');
  await correction.getByLabel('Seu e-mail').fill('teste@example.com');
  await correction.getByLabel('Sugestão', { exact: true }).fill('Teste de referência');
  await correction.getByRole('button').click();
  await expect(page.locator('#msg-form')).toContainText('Nada foi enviado');
  await page.goto('/experimentar/genesis/?capitulo=2&verso=3');
  await expect(page.getByRole('navigation', { name: 'Principal', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Voltar à passagem original/ }).click();
  await expect(page).toHaveURL(/capitulo=2&verso=3/);
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
});

test('efeitos ativos inicialmente e preferência de silêncio persistida', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      if (this.src.endsWith('/tomo.mp3') || this.src.endsWith('/folhas.mp3')) document.documentElement.dataset.effect = this.src;
      return Promise.resolve();
    };
  });
  await page.goto('/ler/genesis/');
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Abrir Gênesis', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-effect', /tomo.mp3/);
  await page.getByRole('button', { name: 'Ajustes de leitura' }).click();
  await page.getByRole('button', { name: 'Áudio · ambiente e efeitos' }).click();
  await expect(page.getByLabel('Sons de folhas e capa')).toBeChecked();
  await page.getByLabel('Sons de folhas e capa').uncheck();
  await page.reload();
  await expect(page.locator('.flipbook-shell')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Ajustes de leitura' }).click();
  await page.getByRole('button', { name: 'Áudio · ambiente e efeitos' }).click();
  await expect(page.getByLabel('Sons de folhas e capa')).not.toBeChecked();
});
