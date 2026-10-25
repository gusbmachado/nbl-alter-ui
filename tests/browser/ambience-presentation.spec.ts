import { test, expect } from '@playwright/test';

test('ambient audio loops quietly and remembers opt-out', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { this.dataset.started = 'true'; return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () { this.dataset.started = 'false'; };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Áudio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Desligar som ambiente' })).toBeVisible();
  const tracks = await page.locator('.ambience audio').evaluateAll(elements => elements.map(element => {
    const audio = element as HTMLAudioElement;
    return { loop: audio.loop, volume: audio.volume, started: audio.dataset.started };
  }));
  expect(tracks).toEqual([{ loop: true, volume: 0.12, started: 'true' }, { loop: true, volume: 0.06, started: 'true' }]);
  await page.getByRole('button', { name: 'Desligar som ambiente' }).click();
  await page.goto('/tradutor/');
  await page.getByRole('button', { name: 'Áudio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ligar som ambiente' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('.ambience audio').evaluateAll(elements => elements.every(el => !(el as HTMLElement).dataset.started))).toBe(true);
});

test('sticky home navigation and biography milestones work on small and large screens', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Principal', exact: true })).toHaveCount(1);
  await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Tradutor', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Luiz Ribeiro');
  const milestone = page.locator('details').filter({ hasText: 'Pós-doutorado' });
  await milestone.locator('summary').click();
  await expect(milestone).toHaveAttribute('open', '');
  await expect(milestone.getByRole('heading', { name: 'Universidade Federal de Juiz de Fora' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('biography.png'), fullPage: true });
  await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Projeto', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sobre o projeto');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('project.png'), fullPage: true });
});

test('blocked autoplay retries after interaction without preventing opt-out', async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    HTMLMediaElement.prototype.play = function () {
      attempts++;
      return attempts <= 2 ? Promise.reject(new DOMException('Blocked', 'NotAllowedError')) : Promise.resolve();
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Áudio', exact: true }).click();
  await expect(page.locator('#ambience-status')).toContainText('Interaja');
  await page.getByRole('button', { name: 'Fechar áudio' }).click();
  await page.locator('h1').click();
  await page.getByRole('button', { name: 'Áudio', exact: true }).click();
  await expect(page.locator('#ambience-status')).toContainText('Tocando');
  await page.getByRole('button', { name: 'Desligar som ambiente' }).click();
  await expect(page.locator('#ambience-status')).toContainText('Som desligado');
});

 test('supplied audio files decode in the browser', async ({ page }) => {
  await page.goto('/projeto/');
  await page.locator('.ambience audio').evaluateAll(elements => elements.forEach(element => (element as HTMLAudioElement).load()));
  await expect.poll(() => page.locator('.ambience audio').evaluateAll(elements => elements.every(element => {
    const audio = element as HTMLAudioElement;
    return !audio.error && Number.isFinite(audio.duration) && audio.duration > 0;
  }))).toBe(true);
});
