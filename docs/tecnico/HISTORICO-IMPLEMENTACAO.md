> Registro histórico anterior à oficina de edição. Para orientações atuais, consulte o README da raiz e ARQUITETURA.md. Caminhos e estados aqui registrados podem refletir etapas anteriores.

# Nossa Biblioteca Livre

Prova de conceito independente baseada no pacote `codex-nbl/`. Inclui a amostra real de Gênesis 1–3 fornecida pelo responsável em `ref-text.txt`, atribuída a Osvaldo Luiz Ribeiro, e um texto fictício de Salmos para testes. A interface não é oficial e seus números não representam o andamento do projeto original.

**Stack solicitada: Astro + React Islands + TypeScript + Sveltia CMS + Cloudflare Pages. Gerenciador: pnpm.** Essa orientação posterior do responsável substitui a escolha de Next.js em `codex-nbl/INSTRUCOES-CODEX.md`. A saída de produção é `dist/`, inteiramente estática.

## Estado desta entrega

Implementação baseada na referência v2: flipbook StPageFlip com capas rígidas, capítulos reunidos em um tomo, navegação por capítulo/verso e modo Estudo. A home usa a imagem fornecida com profundidade em camadas e inclinação interativa. Meddon fica restrita ao texto da tradução.

Build estático e checagem TypeScript passaram; 18 testes TypeScript passaram. O lockfile está incluído. O relatório de navegador e as limitações da prova de conceito estão em [docs/QA.md](docs/QA.md). CMS autenticado e implantação não foram realizados.

## Desenvolvimento e verificação

Em um ambiente com Node.js 22.12 ou superior:

```sh
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install
pnpm content:validate
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm dev
```

Se Corepack não estiver disponível, instale-o conforme a distribuição de Node utilizada ou instale a versão de pnpm indicada em `packageManager`. O `pnpm-lock.yaml` fixa também as dependências transitivas. Use `pnpm install --frozen-lockfile` em CI.

- `pnpm dev`: servidor Astro em `http://localhost:4321`.
- `pnpm build`: valida conteúdo, exporta os JSON pelas rotas Astro, compila as páginas e audita `dist/`.
- `pnpm preview`: prévia da última compilação estática.
- `pnpm test`: testes de conteúdo, configuração e preservação textual/posição na paginação.
- `pnpm test:e2e`: build e testes Playwright em desktop e viewport móvel.
- `python3 scripts/audit-source.py`: auditoria suplementar offline, requer PyYAML. Não substitui os comandos acima.

## Estrutura

```text
src/pages/                    páginas Astro pré-renderizadas
src/layouts/                  documento e navegação compartilhados
src/components/Reader.tsx     ilha React hidratada com client:load
src/components/Notes.tsx      diálogo de notas, busca e filtros
src/components/Continue.tsx   pequena ilha para retomada local
src/lib/content.ts            leitura e validação, somente no build
src/components/FlipBook.tsx   integração isolada com StPageFlip
src/lib/folio.ts              composição de capítulos e âncoras semânticas
src/lib/folio-dom.ts          folhas HTML e medição de texto
src/content/                 fonte editorial JSON, fora de public/
public/admin/                Sveltia e configuração
src/pages/dados/             rotas JSON; estáticas em produção
public/img/, public/audio/   assets fornecidos
scripts/                    geração, validação e auditoria de exportação
tests/                      testes unitários e de navegador
codex-nbl/                  pacote original preservado
```

Landing e biblioteca não dependem de React para exibir seu conteúdo. A busca e alternância de estante são JavaScript pequeno do Astro. As rotas `/livros/[slug]/` e `/ler/[slug]/` são geradas por `getStaticPaths`; leitores são gerados somente para livros disponíveis. Não há servidor de aplicação, API de runtime, banco, cookies de servidor ou autenticação de leitores.

## Conteúdo e fluxo editorial

Os 66 livros e as quatro coleções estão em arquivos individuais. Componentes não fixam a quantidade de livros. `enabled`, `order`, `collectionId`, `canonTags` e `coverVariant` permitem expandir o catálogo por dados.

Capítulos e notas usam **JSON estruturado**, formato suportado pelo Sveltia. O campo `body` de cada nota contém Markdown. A organização é plana para facilitar criação e busca no CMS:

```text
src/content/chapters/genesis-001.json
src/content/notes/gn-1-1-01.json
```

1. Em `/admin/`, configure ou edite o livro e sua coleção. Identificadores devem permanecer estáveis.
2. Crie um capítulo com `id` único (ex.: `genesis-004`), `book: genesis`, `chapter: 4`, `status: draft` e versos numerados explicitamente.
3. Use `style: poetry` para preservar quebras de linha; `prose` para parágrafos comuns. O texto dos versos é texto simples, sem HTML. Não renumere versos por sua posição na lista.
4. Crie notas em **Notas — edição individual**, informando livro, capítulo, escopo, intervalo e categoria. `scope: verse` exige início e fim iguais; `range` admite intervalo; `chapter` dispensa versos. A ordem e o ID determinam a ordenação.
5. Categorias são configuráveis em **Configurações**. A nota usa o ID da categoria, validado no build.
6. Revise os textos e marque o capítulo como `published`. Notas têm estado próprio; uma nota publicada exige capítulo publicado. Altere o livro de `planned` para `in_progress` antes de publicar seu primeiro capítulo.
7. O commit aciona a compilação do Cloudflare Pages. A nova versão só deve substituir a anterior se o build passar. Confira o deployment e a URL do capítulo.

`publicationState: complete` exige todos os capítulos e confirmação editorial explícita. A porcentagem não muda esse estado automaticamente. `totalChapters: null` significa total desconhecido. A base inicial usa a contagem convencional protestante para planejamento; não é progresso importado do site oficial.

Notas são arquivos independentes, com resumo pesquisável por livro, capítulo, verso, título e ID. O conjunto de testes oferece 30 notas fictícias em Salmos 1:1 para validar a ergonomia do editor sem listas gigantes dentro do capítulo. A configuração inclui ordenação e filtros, mas o uso real do editor ainda exige teste manual.

**Rascunhos:** nunca entram nos JSON gerados nem nas props das ilhas. As rotas Astro de `/dados/` exportam somente os capítulos publicados. O comando de conteúdo remove a antiga pasta gerada `public/dados` para evitar arquivos obsoletos. A auditoria pós-build verifica rotas, JSON e o marcador de rascunho nos arquivos públicos. Conteúdo no Git e seu histórico não são protegidos por essa filtragem: utilize repositório privado para material editorial reservado.

## Leitor

- Abre pela capa fechada; a placa HTML identifica o tomo sem apagar a arte.
- Duas folhas em telas largas, uma em telas pequenas; modo estudo sempre com uma coluna.
- Vários versos por folha, com continuação dos versos maiores que a área disponível. A composição mede o DOM com a mesma fonte, largura e altura do livro. Fonte e viewport recompõem as folhas, preservando capítulo, verso e offset.
- Fonte de 16 a 30 px, escolha Meddon/Garamond, temas pergaminho/noturno, capítulo e verso, notas on/off. O modo Estudo usa Garamond e texto contínuo.
- Notas de verso/faixa acessíveis por marcador com quantidade; notas de capítulo têm botão próprio. Markdown não aceita HTML bruto. Diálogo nativo com Esc, foco contido e retorno ao marcador, filtros e scroll interno.
- Som desligado inicialmente. Abertura/folhas usam os MP3 fornecidos apenas após interação; falhas de áudio não interrompem a leitura. Volume e preferências persistem quando o navegador permite.
- Progresso `{bookSlug, chapter, verse, offset}` em `localStorage`, com fallback para armazenamento bloqueado e referências retiradas.
- Links permanentes: `/ler/genesis/?capitulo=1&verso=3`. O leitor acrescenta `offset` textual para preservar o ponto dentro de um verso longo ao recarregar ou compartilhar. A folha física não participa do endereço. Um link explícito prevalece sobre a retomada salva.
- Ao abrir um tomo, carrega seus capítulos publicados de `/dados/<slug>/<capítulo>.json` e os compõe em sequência. Outros tomos não são carregados. Para volumes completos muito grandes, avaliar composição incremental antes de uso em produção.
- StPageFlip 2.0.7, importado apenas no navegador: virada pelo arraste dos cantos, botões e setas no contêiner focado. Movimento reduzido usa transição imediata. Capas rígidas são as imagens fornecidas; o título do tomo permanece HTML.

## Sveltia CMS e autenticação

Sveltia está fixado em `0.248.0` no `src/pages/admin/index.astro`. A configuração usa arquivos JSON, widgets de lista/relação e notas independentes. O script do editor é carregado do CDN; portanto o admin precisa de rede.

Preencha `backend.repo` em `public/admin/config.yml` com `proprietario/repositorio`, e confira `backend.branch`. O placeholder não fornece autenticação funcional. O usuário autenticado precisa de acesso de escrita ao repositório.

Opções:

- Desenvolvimento: abra `/admin/` em navegador compatível com acesso a pasta local, seguindo o [fluxo local do Sveltia](https://sveltiacms.app/en/docs/workflows/local). A configuração de backend continua sendo necessária; nenhuma credencial deve ser salva no repositório.
- Login com token: o Sveltia oferece entrada por token. Restrinja o token ao repositório e às permissões necessárias de conteúdo/leitura e escrita; informe-o somente na interface de login. Confira o procedimento no [backend GitHub](https://sveltiacms.app/en/docs/backends/github).
- OAuth: instale o [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) em um Cloudflare Worker separado. Cadastre a aplicação OAuth no GitHub com callback `<URL-DO-WORKER>/callback`, configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` como secrets do Worker e restrinja os domínios permitidos conforme a documentação do autenticador. Acrescente `backend.base_url: https://seu-autenticador.workers.dev` à configuração. Confirme as variáveis e permissões na versão do autenticador escolhida antes de publicar.

O site não contém secrets. `/admin/` é uma página pública do editor; apenas o backend autenticado autoriza gravações. Para restringir também o carregamento dessa página, o proprietário deve configurar uma aplicação e política **Cloudflare Access para `/admin*`**, incluindo o domínio usado para acessar o editor. Isso **não está configurado nesta entrega**. Teste o fluxo OAuth após aplicar a política.

## Cloudflare Pages

1. Crie o repositório GitHub e envie o projeto, incluindo o lockfile após a primeira instalação validada. Recomenda-se privado se houver rascunhos reservados.
2. Crie um projeto **Pages**, conecte o repositório e escolha a branch de produção.
3. Diretório raiz: raiz deste projeto; framework: Astro; Node: 22.12 ou superior.
4. Comando de build: `pnpm build`; diretório de saída: **`dist`**.
5. Configure a versão de pnpm em acordo com `packageManager`. Se o ambiente não a detectar, utilize `corepack prepare pnpm@10.18.3 --activate` na preparação do build.
6. Após validar o lockfile, use instalação congelada e checks/testes no CI antes do deploy. Preview deployments também devem executar a validação de conteúdo.
7. Configure domínio e OAuth/Access conforme necessário. Não é necessário adaptador SSR nem Worker para o site estático; o autenticador OAuth, se escolhido, é separado.

O arquivo `public/_headers` fornece cabeçalhos básicos e revalidação dos JSON. Não use fallback SPA que devolva `index.html` com 200 para JSON inexistente; `/dados/genesis/4.json` deve retornar 404; Gênesis 3 agora está disponível.

**Antes de publicação pública:** o responsável precisa confirmar os direitos das imagens, inscrições incorporadas e áudios fornecidos. A amostra real foi fornecida pelo responsável para integração ao protótipo; essa entrega não afirma autorização de publicação pública ou licença da tradução. Configure um `newsletterUrl` real em `src/content/site.json` para exibir a chamada de novidades; nenhum email é coletado localmente.

## Referências verificadas

- [Organização dos livros do projeto original](https://nossabiblialivre.com/os-livros-da-biblia/): consultada somente para estrutura.
- [Ilhas React no Astro](https://docs.astro.build/en/guides/integrations-guide/react/).
- [Astro no Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/).
- [Formatos editoriais Sveltia](https://sveltiacms.app/en/docs/collections/entries/formats).
- [Coleções editoriais Sveltia](https://sveltiacms.app/en/docs/collections/entries).

## Limitações conhecidas

- Virada é transição CSS leve, não simulação física StPageFlip/3D. O modo estudo remove animação e ornamentos; desempenho em hardware de entrada ainda não aferido.
- Uma unidade de verso por folha prioriza integridade e retomada, mas produz espaços vazios em versos curtos. Não há composição tipográfica densa de vários versos por página.
- Versos admitem texto simples, parágrafos e poesia. Formatação Markdown está disponível nas notas, não nos versos.
- Fontes vêm do Google Fonts, com fallbacks locais Georgia/serif. O texto continua legível sem rede; auto-hospedagem de fontes pode ser adotada depois.
- As capas e contracapas usam os JPEGs fornecidos em `public/img/`, já recoloridos. O título institucional incorporado à arte permanece; uma placa HTML separada identifica coleção ou tomo. Não há recoloração adicional nem dependência da matriz anterior.
- O leitor exige JavaScript; o catálogo e os índices permanecem em HTML. Não há leitura offline via service worker.
- Credenciais CMS, UI administrativa, build Astro, testes automatizados e revisão visual precisam da validação descrita acima.

## Capas por coleção

`src/lib/covers.ts` resolve os arquivos reais descritos em `public/img/README.md`:

| Variante CMS | Coleção | Capa / contracapa |
|---|---|---|
| `brown` | Torá | `tora-capa.jpg` / `tora-contracapa.jpg` |
| `wine` | Profetas | `profetas-capa.jpg` / `profetas-contracapa.jpg` |
| `green` | Escritos | `escritos-capa.jpg` / `escritos-contracapa.jpg` |
| `blue` | Novo Testamento Grego | `novo-testamento-grego-capa.jpg` / `novo-testamento-grego-contracapa.jpg` |
| padrão | Institucional / fallback | `padrao-capa.jpg` / `padrao-contracapa.jpg` |

A URL pública começa em `/img/`, não `/assets/covers/` (o caminho no README dos assets é ilustrativo). `BookCover.tsx` é compartilhado entre Astro estático e React. `BackCover.tsx` exibe a contracapa correspondente e sua inscrição em HTML acessível. A proporção original é preservada: capas 650 × 927; contracapas 630 × 927. Os títulos dos tomos são HTML, sem alterações nos JPEGs. Os títulos institucionais já gravados na arte não foram apagados.

`3d.png` é usado na apresentação institucional da landing como imagem em perspectiva, não como modelo ou motor 3D. Todos os 11 arquivos fornecidos são preservados. A antiga matriz `encadernacao-base-v2.png` não é utilizada. A revisão no Chromium é registrada em `docs/QA.md`.

## Amostra real de Gênesis 1–3

O arquivo original `ref-text.txt` permanece intacto e fora de `public/`. O importador local `scripts/import_genesis.py` separa estritamente os números de versos dos marcadores de notas concatenados na cópia. A importação só é aceita quando todos os marcadores aparecem na ordem esperada e correspondem às 494 notas.

| Capítulo | Versos | Notas |
|---|---:|---:|
| Gênesis 1 | 31 | 184 |
| Gênesis 2 | 25 | 172 |
| Gênesis 3 | 24 | 138 |

As quebras entre sentenças são preservadas com `style: poetry` como **recurso de apresentação**, não classificação literária do texto. Não houve revisão da tradução, pontuação ou comentários. Foram retirados somente os marcadores numéricos e o símbolo de retorno das notas; um espaço é restaurado quando o marcador havia unido palavras. Por exemplo, `erva75fazedora` torna-se `erva fazedora`, com a nota vinculada ao verso. Casos como `11234`, `1074` e o trecho de Gênesis 2:4 iniciado por `262728` têm testes específicos.

As notas mantêm corpo e número originais, em arquivos `gn-<capítulo>-nota-<número>.json`. A categoria inicial é `other`: nenhuma classificação filológica foi inventada. Onde a cópia diz “clique neste link” sem fornecer endereço, o comentário permanece assim; não foram inventadas URLs. O vínculo é por verso, não por posição de palavra.

`contentKind: sample` e `sourceLabel` identificam a origem no CMS, catálogo e leitor. Salmos usa `contentKind: demonstration` e retém os ensaios de verso longo/30 notas fictícias, sem mistura com as notas reais. O antigo texto fictício de Gênesis 1 está preservado somente em `tests/fixtures/genesis-demo.json`. O teste de rascunho foi deslocado para Gênesis 4.

Para conferir a correspondência com a cópia fornecida:

```sh
python3 scripts/import_genesis.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Ambos foram executados: comparação integral passou e os cinco testes Python passaram. `docs/genesis-import.json` registra SHA-256 da fonte, contagens e mapeamento nota → verso. Para **reimportar e sobrescrever os três capítulos e as notas geradas**, execute explicitamente `python3 scripts/import_genesis.py --write`. O build não executa essa importação nem sobrescreve edições do CMS. Se editar o conteúdo importado pelo CMS, a conferência com o original passa a sinalizar a divergência; revise-a antes de reimportar.

## Home institucional e efeito da imagem

A página inicial aproxima a organização da [home original](https://nossabiblialivre.com/) com sínteses atribuídas e links para a íntegra: projeto, tradução, tradutor, andamento, apoio e contato. A biblioteca do protótipo e suas contagens permanecem identificadas separadamente. Apoio e mensagens são encaminhados aos serviços oficiais; não há formulário local sem backend.

O efeito da referência v2 está em `src/components/HeroCodex.astro` e `src/styles/home.css`. A imagem `3d.png` permanece intacta: camadas com `translateZ`, perspectiva e luz mascarada acompanham o ponteiro; `scaleY(1.12)` alonga discretamente a apresentação. Não há recorte poligonal. Teclado tem foco visível e movimento reduzido desliga as transformações.

## Roteiro para apresentar a Osvaldo

1. Na home, apresente a proposta visual e entre na Biblioteca.
2. Abra Gênesis pela capa e vire as folhas pelos cantos ou pelos botões.
3. Selecione o capítulo 3 e abra uma nota da tradução real.
4. Experimente tamanho da fonte, modo Estudo e retomada da leitura.
5. Mostre a separação entre conteúdo JSON, componentes React e páginas Astro para discutir o reaproveitamento. Salmos é apenas um ensaio técnico fictício.

A referência v2 permanece preservada em `codex-nbl/referencias/`. A integração não depende do HTML monolítico do protótipo; conteúdo, composição e interação ficam em módulos separados.

## Acesso local ao leitor e ao editor

Use `pnpm dev` e o endereço HTTP informado pelo Astro. Não abra os arquivos de `dist/` por `file://`: o leitor depende de módulos JavaScript e requisições de capítulos. Para conferir o build, use `pnpm build` e `pnpm preview`.

- Leitor: `/ler/genesis/` ou `/ler/salmos/`. Clique na capa ou em “Abrir o tomo”. Os demais livros ainda não têm capítulos publicados nesta amostra.
- Editor: `/admin/`, também disponível pelo rodapé. A rota funciona em desenvolvimento e na exportação estática.
- No Sveltia, escolha **Work with Local Repository** em Chrome/Edge e selecione a raiz do projeto. O login remoto pelo GitHub ainda requer substituir o repositório de exemplo na configuração. Consulte o [fluxo local do Sveltia](https://sveltiacms.app/en/docs/workflows/local).

As dependências do leitor são pré-otimizadas pelo Vite. Se uma sessão antiga mostrar `Outdated Optimize Dep`, reinicie `pnpm dev` e recarregue a aba. Os capítulos agora são atendidos por rotas Astro, sem depender de uma cópia gerada dentro de `public/` durante o desenvolvimento.

Para repetir os testes contra um servidor de desenvolvimento já aberto: `NBL_TEST_BASE_URL=http://localhost:4321 pnpm test:e2e`. Isso também verifica as rotas JSON no desenvolvimento.
