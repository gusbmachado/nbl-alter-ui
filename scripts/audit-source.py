"""Offline source audit; supplements, never replaces, the TypeScript/browser suites."""
import json
import re
from pathlib import Path
import yaml
root = Path(__file__).resolve().parents[1]
def load(folder):
    return [json.loads(f.read_text()) for f in sorted((root / 'src/content' / folder).glob('*.json'))]
collections = sorted(load('collections'), key=lambda c: c['order'])
books, chapters, notes = load('books'), load('chapters'), load('notes')
site = json.loads((root / 'src/content/site.json').read_text())
spec = (root / 'codex-nbl/INSTRUCOES-CODEX.md').read_text()
assert len(books) == 66
assert [c['title'] for c in collections] == ['Torá', 'Profetas', 'Escritos', 'Novo Testamento Grego']
for c in collections:
    line = next(line for line in spec.splitlines() if line.startswith('- **' + c['title'] + ':**'))
    expected = line.split('** ')[1].rstrip('.').split(', ')
    actual = sorted([b for b in books if b['collectionId'] == c['id']], key=lambda b: b['order'])
    assert [b['title'] for b in actual] == expected
for values, key in [(books, 'slug'), (chapters, 'id'), (notes, 'id'), (collections, 'id')]:
    assert len({v[key] for v in values}) == len(values)
    assert all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', v[key]) for v in values)
for c in chapters:
    book = next(b for b in books if b['slug'] == c['book'])
    assert 0 < c['chapter'] <= book['totalChapters']
    assert len({v['number'] for v in c['verses']}) == len(c['verses'])
    assert all(v['text'] and v['number'] > 0 for v in c['verses'])
for n in notes:
    chapter = next(c for c in chapters if c['book'] == n['book'] and c['chapter'] == n['chapter'])
    assert n['category'] in [c['id'] for c in site['noteCategories']]
    assert n['scope'] in ['verse', 'range', 'chapter']
    if n['scope'] != 'chapter':
        assert n['verseStart'] in [v['number'] for v in chapter['verses']]
        assert n['verseEnd'] in [v['number'] for v in chapter['verses']]
        assert n['verseStart'] <= n['verseEnd']
published = [c for c in chapters if c['status'] == 'published']
assert len(published) == 4
assert len([n for n in notes if n['book'] == 'genesis']) == 494
assert sum(len(c['verses']) for c in published if c['book'] == 'genesis') == 80
assert not any('DRAFT_SENTINEL' in json.dumps(c) for c in published)
assert len([n for n in notes if n['book'] == 'salmos' and n['chapter'] == 1 and n['verseStart'] == 1]) == 30
assert max(len(v['text']) for c in published for v in c['verses']) > 5000
cms = yaml.safe_load((root / 'public/admin/config.yml').read_text())
for name in ['collections', 'books', 'chapters', 'notes']:
    c = next(c for c in cms['collections'] if c['name'] == name)
    assert c['folder'] == 'src/content/' + name and c['format'] == 'json'
    actual_fields = {f['name'] for f in c['fields']}
    assert all(set(entry).issubset(actual_fields) for entry in load(name))
package = json.loads((root / 'package.json').read_text())
assert package['packageManager'].startswith('pnpm@')
assert 'astro' in package['dependencies'] and 'next' not in package['dependencies']
for asset in ['audio/tomo.mp3', 'audio/folhas.mp3']:
    assert (root / 'public' / asset).read_bytes() == (root / 'codex-nbl/public' / asset).read_bytes()
for name in ['padrao', 'tora', 'profetas', 'escritos', 'novo-testamento-grego']:
    for side in ['capa', 'contracapa']:
        assert (root / 'public/img' / f'{name}-{side}.jpg').is_file()
assert (root / 'public/img/3d.png').is_file()
print('PASS: 66 títulos e ordem exata; 4 coleções; referências e IDs; 4 capítulos públicos; 494 notas reais e 30 fictícias; verso longo; configuração YAML e campos; stack Astro/pnpm; assets preservados.')
print('NÃO verificados: compilação Astro/TypeScript, exportação real e comportamento em navegador.')
