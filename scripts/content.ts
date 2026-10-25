import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from '../src/lib/content';
const result = compile();
if (!process.argv.includes('--validate')) {
  // Remove only the obsolete generated output. Astro now owns /dados/ routes,
  // preventing stale/missing public files while the dev server is running.
  rmSync(resolve('public/dados'), { recursive: true, force: true });
}
console.log(`${result.catalog.books.length} livros; ${result.chapters.length} capítulos públicos; conteúdo validado.`);
