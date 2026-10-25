import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { coverAsset } from '../src/lib/covers';
import { compile } from '../src/lib/content';

test('cada coleção possui capa e contracapa fornecidas, sem referências à matriz removida', () => {
  const { catalog } = compile();
  for (const collection of catalog.collections) {
    for (const side of ['capa', 'contracapa'] as const) {
      const file = coverAsset(collection.coverVariant, side);
      assert(existsSync(`public${file}`), `Asset ausente: ${file}`);
    }
  }
  assert.equal(coverAsset('brown'), '/img/tora-capa.jpg');
  assert.equal(coverAsset('wine'), '/img/profetas-capa.jpg');
  assert.equal(coverAsset('green'), '/img/escritos-capa.jpg');
  assert.equal(coverAsset('blue'), '/img/novo-testamento-grego-capa.jpg');
  assert.equal(coverAsset(), '/img/padrao-capa.jpg');
  assert.equal(coverAsset('unknown', 'contracapa'), '/img/padrao-contracapa.jpg');
});
