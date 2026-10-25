import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile, readSource } from '../src/lib/content';
import { coverAsset } from '../src/lib/covers';
const { catalog, chapters } = compile();
for (const variant of [undefined, ...catalog.collections.map(c => c.coverVariant)]) {
  for (const side of ['capa', 'contracapa'] as const) {
    assert(existsSync(`dist${coverAsset(variant, side)}`), `Encadernação não exportada: ${variant}/${side}`);
  }
}
for (const route of ['index.html', 'projeto/index.html', 'tradutor/index.html', 'img/logo.png', 'audio/soundtrack.mp3', 'audio/scene.mp3', 'biblioteca/index.html', '404.html', 'admin/index.html', 'admin/config.yml',
  ...catalog.books.map(b => `livros/${b.slug}/index.html`),
  ...catalog.books.filter(b => b.chapters.length).flatMap(b => [`ler/${b.slug}/index.html`, `experimentar/${b.slug}/index.html`])]) {
  assert(existsSync(join('dist', route)), `Rota estática ausente: ${route}`);
}
for (const chapter of chapters) {
  const result = JSON.parse(readFileSync(`dist/dados/${chapter.book}/${chapter.chapter}.json`, 'utf8'));
  assert.deepEqual(result, chapter);
}
for (const draft of readSource().chapters.filter(c => c.status === 'draft')) {
  assert(!existsSync(`dist/dados/${draft.book}/${draft.chapter}.json`), `Rascunho exportado: ${draft.id}`);
}
function scan(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.(html|js|json|css|map)$/.test(file)) {
      assert(!readFileSync(file, 'utf8').includes('DRAFT_SENTINEL_NBL_DO_NOT_EXPORT'), `Vazamento de rascunho em ${file}`);
    }
  }
}
scan('dist');
console.log('Exportação estática: rotas, capítulos e ausência de rascunho verificados.');
