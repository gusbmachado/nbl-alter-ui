# Arquitetura

## Organização

| Caminho | Responsabilidade |
|---|---|
| `src/pages/` | Rotas Astro; inclui JSON estático em `/dados/` |
| `src/components/Reader.tsx` | Leitura publicada ou prévia com dados fornecidos |
| `src/components/FlipBook.tsx` | Integração com StPageFlip e recomposição das folhas |
| `src/components/DemoEditor.tsx` | Oficina aberta de edição |
| `src/lib/drafts.ts` | Validação de importação e armazenamento IndexedDB |
| `src/lib/content.ts` | Validação editorial e exclusão de rascunhos da exportação |
| `src/lib/folio.ts`, `folio-dom.ts` | Composição e medição de texto sem perda de caracteres |
| `src/content/` | Conteúdo editorial original, em JSON |
| `src/styles/` | Apresentação; ajustes da v2 em `experience.css` |
| `public/admin/config.yml` | Campos e backend do Sveltia |
| `public/img/`, `public/audio/` | Assets fornecidos |
| `codex-nbl/`, `ref-text.txt` | Referências originais preservadas |
| `scripts/`, `tests/` | Importação, validação e regressão |
| `docs/tecnico/` | Arquitetura, publicação, QA e histórico |

## Fluxos de conteúdo

Publicado: JSON editorial → validação → rotas Astro → HTML/JSON em `dist/` → leitor.

Demonstração: JSON publicado → cópia em memória → edição → IndexedDB e/ou arquivo exportado → prévia React. A oficina não escreve no repositório, não chama o CMS e não possui endpoint de publicação.

O formato de rascunho é um envelope `{ version: 1, book, chapters }`. Na importação, os números dos capítulos/versos devem corresponder à amostra. IDs de notas são únicos e os intervalos e categorias são validados. Identidade e procedência são reconstruídas a partir da fonte original. Não copie um rascunho diretamente para `src/content/`: ele precisa passar por revisão e separação editorial antes de ser publicado.

O leitor de prévia recebe `previewChapters`, `startChapter` e `startVerse`. Sua navegação não altera o endereço nem a posição salva da leitura publicada. As notas e a página identificam as alterações como demonstração, sem atribuí-las ao tradutor.

## Execução

```sh
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Para testar o servidor de desenvolvimento já aberto:

```sh
NBL_TEST_BASE_URL=http://localhost:4321 pnpm test:e2e
```

O Playwright padrão compila e inicia uma prévia na porta 4329. `pnpm build` valida a exportação real e a ausência do marcador de rascunho.

A conferência da amostra original usa `python3 scripts/import_genesis.py`; os testes Python usam `python3 -m unittest discover -s tests -p 'test_*.py' -v`. O relatório de importação está em `genesis-import.json`. A opção `--write` sobrescreve os arquivos importados e só deve ser usada para reimportar deliberadamente a fonte.

## Decisões e limites

- Site estático com ilhas React; sem banco de dados ou servidor de aplicação em produção.
- O tomo selecionado é carregado inteiro. Volumes completos maiores precisam de avaliação de desempenho.
- Meddon só no texto de tradução do leitor. Editor e controles usam fontes legíveis convencionais.
- A oficina usa uma cópia por tomo e navegador. Não oferece colaboração, histórico de revisões nem sincronização entre abas.
- Login do Sveltia e publicação remota permanecem fora do modo de demonstração.
- Progresso e conteúdo da PoC não representam o andamento do projeto oficial.

## Apresentação, biografia e som

`/projeto/` e `/tradutor/` usam `presentation.css`. A biografia é uma timeline com elementos `details` nativos, acessíveis por teclado e disponíveis sem JavaScript. Seus dados ficam em `src/content/presentation/biography.json`: os campos `image` (URL local em `/img/`) e `alt` permitem inserir logos ou imagens com fundo transparente. O retrato usa `/img/profile.png`. A timeline usa `bio-1.png` nos três primeiros marcos, `bio-2.png` no quarto, `bio-3.png` no quinto e `logo.png` nos dois últimos. As imagens ilustram o percurso e não indicam vínculos institucionais atuais.

A logo fornecida fica em `public/img/logo.png`. `Ambience.astro` reproduz `soundtrack.mp3` e `scene.wav` simultaneamente em loop. Os volumes solicitados ao navegador são 0,12 e 0,06; o volume físico depende do dispositivo. Não há garantia de autoplay: rejeições são tratadas e a reprodução é tentada novamente após interação. Preferência em localStorage, posição por faixa em sessionStorage, com tolerância ao bloqueio de armazenamento. Não usa roteamento cliente; entre documentos há uma possível interrupção. Os loops usam a repetição nativa dos arquivos, sem edição de suas emendas. A trilha é independente dos efeitos do flipbook.
