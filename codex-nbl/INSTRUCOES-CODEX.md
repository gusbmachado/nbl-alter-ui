# Nossa Bíblia Livre — especificação consolidada para Codex

**Versão:** 1.0, 19/10/2026  
**Natureza:** interface experimental, independente e não oficial, sem reprodução da tradução de Osvaldo Luiz Ribeiro.  
**Objetivo da entrega do Codex:** aplicação funcional, testada e publicável; não apenas mockup.

## 0. Hierarquia de referência

1. **Este documento:** decisões funcionais, editoriais, arquiteturais e critérios de aceite. Prevalece em caso de conflito.
2. **Site original:** <https://nossabiblialivre.com/> e <https://nossabiblialivre.com/os-livros-da-biblia/>. Consultar exclusivamente organização dos livros, linguagem institucional, divisões e modelo de exibição do progresso; **NÃO copiar nem baixar o texto da tradução**. O site pode mudar: não importar automaticamente contagens como se fossem atuais.
3. `referencias/prototipo-original.html`: referência visual e comportamental, **não** código que deva ser copiado integralmente. Contém imagens embutidas em base64, JavaScript monolítico e dados fictícios de demonstração.
4. `referencias/guia-original.md`: referência técnica anterior, útil para entender interação, efeitos e CMS. **Não adotar automaticamente** suas decisões substituídas aqui: Astro, apenas duas seções AT/NT, fonte Meddon em todos os versículos, numeração de versículo apenas por linha, limite informal de notas curtas e URLs baseadas em hash.
5. `public/img/capa.jpg`, `public/img/contracapa.jpg`, `public/audio/tomo.mp3`, `public/audio/folhas.mp3`: assets originais para a primeira versão; não são imagens com transparência e não devem ser descritas como PNG de fundo removido.

## 1. Fundamento editorial e limites

A proposta parte do princípio expresso no site de referência de que a Bíblia é **uma biblioteca de escritos distintos**. A UI não deve homogeneizar suas vozes, gêneros e contextos, nem simular conteúdo original do projeto como se fosse publicado oficialmente.

O catálogo inicial deve conter **os 66 livros do cânone protestante**, **organizados exatamente nas quatro divisões e na sequência de leitura do site de referência**, que diferem da sequência convencional de algumas Bíblias:

- **Torá:** Gênesis, Êxodo, Levítico, Números, Deuteronômio.
- **Profetas:** Josué, Juízes, 1 Samuel, 2 Samuel, 1 Reis, 2 Reis, Isaías, Jeremias, Ezequiel, Oseias, Joel, Amós, Obadias, Jonas, Miqueias, Naum, Habacuque, Sofonias, Ageu, Zacarias, Malaquias.
- **Escritos:** Salmos, Provérbios, Jó, Cântico dos Cânticos, Rute, Lamentações, Eclesiastes, Ester, Daniel, Esdras, Neemias, 1 Crônicas, 2 Crônicas.
- **Novo Testamento Grego:** Mateus, Marcos, Lucas, João, Atos dos Apóstolos, Romanos, 1 Coríntios, 2 Coríntios, Gálatas, Efésios, Filipenses, Colossenses, 1 Tessalonicenses, 2 Tessalonicenses, 1 Timóteo, 2 Timóteo, Tito, Filemom, Hebreus, Tiago, 1 Pedro, 2 Pedro, 1 João, 2 João, 3 João, Judas, Apocalipse.

**Extensão futura, NÃO parte da implementação de conteúdo do MVP:** deuterocanônicos e anagignoscómena, eventualmente outras obras. Construir dados configuráveis de `collections`, `books`, `canonTags`, `order` e `enabled` sem hardcode de 66 volumes nos componentes; permitir a inserção de novas coleções e livros com alteração de dados via CMS. O MVP não precisa oferecer um seletor completo de cânones.

A interface é **estudo independente e não oficial** até eventual autorização do projeto; exibir aviso discreto e link oficial. Nunca raspar a tradução, copiar capítulos reais, afirmar afiliação/autorização inexistente, inserir a tradução do professor no pacote, nem publicar trechos protegidos sem permissão. Usar **conteúdo fictício claramente rotulado**, não atribuído ao professor. Também não atribuir ao autor dados fictícios de progresso.

## 2. Framework: Next.js estático (decisão deliberada)

Usar **Next.js (App Router) + React + TypeScript**, com `output: 'export'` e hospedagem de arquivos gerados em Cloudflare Pages. O motivo da escolha é familiaridade do responsável com React/Next e a riqueza da UI client-side, não uma suposta impossibilidade de usar Astro.

- Conteúdo compilado em build; nenhuma funcionalidade exige servidor Next em runtime.
- Não utilizar Server Actions, endpoints de API de runtime, middleware de autenticação Next, cookies de servidor, ISR, revalidação dinâmica ou otimização padrão de `next/image` que necessite serviço de imagem.
- Para rotas dinâmicas estáticas, usar `generateStaticParams` quando cabível ou rotas estáveis capazes de buscar JSON estático por slug. Garantir **rebuild sem edição de código** quando o CMS publica novo livro/capítulo.
- `Sveltia CMS` na pasta `public/admin/`, editando arquivos Markdown/JSON/YAML no GitHub. Confirmar a sintaxe/configuração/versões no momento de codificar e fixar versões de dependências.
- GitHub é o mecanismo de escrita editorial; Cloudflare Pages faz build a cada commit. Produzir documentação de setup de OAuth (se usado), permissões e opções de proteção adicional do endpoint de UI administrativa.
- Separar componentes client (`'use client'`) da camada de catálogo/transformação executada no build. **Biblioteca e landing pré-renderizadas**, leitor interativo no navegador.
- Usar estrutura e módulos simples: evitar banco de dados, autenticação de leitores, Next server e excesso de bibliotecas.

## 3. Estrutura pública e rotas

| Rota | Conteúdo |
|---|---|
| `/` | Landing institucional: identidade do projeto, manifesto resumido, chamada para ler, dados de andamento, ligação ao projeto original, aviso de demonstração, sem alegar apoio oficial |
| `/biblioteca` | Quatro coleções, estantes de tomos e modo catálogo acessível, progresso por coleção/livro |
| `/livros/[slug]` | Apresentação do tomo, descrição, capítulos disponíveis, capítulos aguardando publicação, progresso |
| `/ler/[slug]` | Capa do tomo, abertura, leitura em pergaminho e notas, índice, som, zoom, tema, retomada |
| `/admin/` | Sveltia CMS: criação/edição dos livros, capítulos, notas e metadados, acesso de escrita mediante GitHub |

É permitido, mas não obrigatório, `/ler/[slug]/[chapter]` se houver implementação estática robusta. Compartilhamento de URL deve permitir livro e capítulo (hash/parametro de busca documentado também serve); não dependa de páginas físicas calculadas para links permanentes.

**Estantes:** mostrar os 66 tomos previstos na ordem acima, com estado `ainda não disponível`, `parcial` ou `completo`; não fingir que os conteúdos do site oficial foram importados. O tomos sem capítulos de demonstração ficam inativos com indicativo correto. Alterar para visualização em cartões acessíveis no celular; oferecer alternância estante/catálogo em outras telas.

**Progresso:** computar `capítulos publicados / total de capítulos`, por tomo, coleção e total, quando números confiáveis estiverem definidos. Caso contrário, mostrar número absoluto ou `a definir`, sem inventar uma porcentagem. Distinguem-se `disponível` (ao menos um capítulo publicado), `parcial` e `concluído` (todos publicados **e** confirmado status editorial). O status editorial nunca deve ser inferido só de uma porcentagem. Mostrar capítulos recentes e/ou previsão somente se esses dados forem preenchidos, nunca com datas inventadas.

**Avisos:** primeira versão pode ter campo de configuração `newsletterUrl` e uma caixa de interesse com link externo; NÃO coletar emails localmente sem serviço real e consentimento.

## 4. Modelo de dados e CMS

Os arquivos de conteúdo são a fonte de verdade. Sugestão de estrutura (ajustar nomenclatura ao suporte real do CMS, sem perder as propriedades):

```text
src/
  content/
    collections/torah.json, prophets.json, writings.json, greek-nt.json
    books/genesis.json, exodo.json, ...
    chapters/genesis/001.md, genesis/002.md, ...
  lib/content/, lib/reader/, lib/audio/
  components/library/, components/reader/, components/notes/
  app/page.tsx, app/biblioteca/page.tsx, app/livros/[slug]/page.tsx,
  app/ler/[slug]/page.tsx
public/
  admin/index.html, admin/config.yml
  img/capa.jpg, img/contracapa.jpg
  audio/tomo.mp3, audio/folhas.mp3
```

Metadados de um livro: `slug`, `title`, `originalTitle?`, `collectionId`, `order`, `canonicalTag?`, `totalChapters`, `publicationState` (`planned|in_progress|complete`), `summary?`, `preface?`, `translatorAttribution?`, `coverVariant?`, `enabled`. IDs e slugs estáveis. Metadados do capítulo: livro, número, título opcional, estado (`draft|published`), data opcional, lista estruturada de versículos e lista de notas. **Não exportar rascunhos nem seus conteúdos para assets públicos/JSON ou bundles JavaScript.** Para proteção real de rascunhos e históricos sensíveis, usar repositório privado, controle de acesso e conferir integração com hosting.

### Versículos

Cada verso precisa de `number` explícito e texto, ainda que o CMS proporcione colagem automática `um verso por linha`. Evitar renumeração implícita por índice que desloque notas quando o texto mudar. Suportar versos longos, poesia, parágrafos e elementos de formatação limitados. Para formatos complexos, permitir uma representação de blocos ou grupos estilísticos, sem alterar o identificador estável `(bookSlug, chapterNumber, verseNumber)`.

Exemplo *estritamente demonstrativo* (pseudomodelo para implementação, não necessariamente sintaxe literal do Markdown escolhido):

```yaml
book: genesis
chapter: 1
status: published
verses:
  - number: 1
    text: "Texto fictício para ensaiar o leitor."
  - number: 2
    text: "Outro trecho fictício para testar a paginação."
notes:
  - id: "gn-1-1-a"
    verseStart: 1
    verseEnd: 1
    category: "philology"
    title: "Exemplo de nota"
    body: "Comentário meramente demonstrativo."
    order: 1
```

### Notas de tradução: relação 1:N, sem limite artificial

Um verso pode possuir **muitas notas**; podem existir notas que cobrem faixa de versos ou o capítulo inteiro (`scope: 'verse'|'range'|'chapter'`). Identificação estável, ordenação explícita, categoria configurável, título opcional, corpo em Markdown seguro e links/bibliografia opcionais. Categorias sugeridas: `literal`, `philology`, `textual_variant`, `wordplay`, `context`, `cross_reference`, `other` (rótulos em português no leitor/editor). Markdown com itálico, negrito, listas e links seguros; preservar termos em hebraico e grego.

No CMS: notas como uma coleção editorial **separada ou sublista estruturada** conforme melhor ergonomia demonstrada com 15–30 notas no mesmo versículo; NÃO criar formulário impraticável com listas gigantes sem recursos de busca, colapso, filtros ou edição isolada. Se o editor padrão do Sveltia não suportar adequadamente essa ergonomia, implementar notas como arquivos independentes (`notes/{book}/{chapter}/{id}.md`) com referência explícita e telas do CMS para cada nota. A decisão deve ser validada com cenário de teste de 30 notas/versículo. Checar consistência referencial na compilação, unicidade de IDs, referências a livro/capítulo/versículo existentes e categorias válidas.

No leitor: **um acionador por verso com notas**, identificando quantidade; abre **um rolo de pergaminho para aquele verso**, contendo lista extensa navegável com subtítulos, filtros e scroll próprio. Botões próximo/anterior nota podem auxiliar, mas não são obrigatórios. Fechamento por Esc, botão e ao virar folha; foco acessível e retorno ao marcador. Em celulares, rolo passa a drawer/modal que ocupa viewport sem cortar conteúdo. Oferecer modo de notas sem ornamentação para leitura acessível.

## 5. Leitor de códices

- Página inicial da leitura começa pela **capa fechada**; toque abre o tomo com animação, respeitando `prefers-reduced-motion`.
- StPageFlip (`page-flip`) ou alternativa de desempenho equivalente, usando duas páginas no desktop, uma no celular. Se biblioteca mantiver orientação, documentar fallback em telas pequenas.
- Papel-pergaminho com textura e rubricas, letras capitulares ornamentais e navegação por setas/botões/toque; cada tomo tem capa e contracapa; a transição entre obras devolve à estante ou abre outro tomo.
- A tipografia do **texto extenso** usa fonte serifada de leitura (ex.: EB Garamond); **Meddon** apenas em capitulares/inscrições e **Cinzel** em títulos. Não usar Meddon em todos os versos.
- Controles: tamanho da fonte (não zoom CSS que corta conteúdo), temas `pergaminho|noturno|estudo`, som ligado/desligado + **slider de volume**, índice por capítulos, ir ao verso, notas on/off, retomada automática e botão “Continuar leitura”.
- Paginação sem truncamento: quebrar versos muito longos em unidades textuais menores quando necessário, sem perder semântica nem marcadores; nunca `overflow:hidden` sobre texto que ultrapassa. Testar que todos os versos continuam legíveis e recuperáveis ao mudar fonte, largura ou orientação.
- Salvar progresso com `{bookSlug,chapter,verse,offset?}`, não com número de folha; migração/fallback em caso de publicação de novos capítulos. `localStorage` com tratamento seguro para bloqueio de armazenamento. Opcional guardar último livro acessado.
- Som somente depois de interação autorizada pelo navegador; controle de volume persistido e saída silenciosa sob preferência `off`. Se os samples não carregarem, a leitura deve continuar funcionando.
- Dados textuais carregados **sob demanda por capítulo**, idealmente `/dados/<slug>/<chapter>.json`, gerados estaticamente durante build; não carregar toda a coleção de uma vez. Prefetch restrito ao próximo capítulo; nenhum dado de rascunho servido.
- Respeitar acessibilidade: teclado, `aria-label`, contraste, foco, alternativas a animações, navegação sem som; reduzida movimentação; conteúdo disponível também em DOM para tecnologias assistivas ou modo estudo.

## 6. Design e assets

**Linguagem:** códice histórico com atmosfera de grimório (sem símbolos de fantasia gratuitos), couro envelhecido, guarnições em metal dourado, pergaminho marfim, rubricatura e tipografia histórica.

Assets incluídos:

| Caminho | Função |
|---|---|
| `public/img/capa.jpg` | Base inicial da capa; título institucional gravado na imagem |
| `public/img/contracapa.jpg` | Base inicial da contracapa, com citação e manifesto já incorporados visualmente |
| `public/audio/tomo.mp3` | Abertura/fechamento da encadernação |
| `public/audio/folhas.mp3` | Folhas e rolo de notas |

**Importante:** como os JPEGs incorporam texto "Nossa Bíblia Livre", usá-los no MVP com uma **placa de nome do tomo** legível como elemento HTML/SVG; não tentar apagar a arte original via CSS. Arquitetar os estilos para substituir por versões futuras sem texto institucional permanente, se geradas. A imagem com contracapa NÃO pode ser tratada como texto acessível: transcrever manifesto/créditos como HTML onde necessário, sem depender do reconhecimento dos pixels. Verificar autorização de uso público das artes e sons antes do deploy.

**Variações de coleções propostas (design tokens, não imagens inventadas):** Torá `castanho/dourado`; Profetas `bordô/bronze`; Escritos `verde-escuro/dourado`; Novo Testamento Grego `azul-escuro/prata envelhecida`. A primeira entrega pode aplicar efeitos CSS discretos em partes independentes dos elementos; **não prometer** quatro imagens renderizadas prontas. Suporte arquitetural a um `coverVariant` por coleção; imagens próprias poderão ser adicionadas depois. Manter visualização alternativa em catálogo no celular.

A landing deve reproduzir o **sentido** do projeto original (literalidade radical, diversidade de vozes, estudo sem catequese), não apropriar-se do status de projeto oficial; textos institucionais literais requerem revisão/atribuição e autorização conforme aplicável. Evitar inventar citações do tradutor ou números de apoiadores.

## 7. Admin e publicação

O CMS deve permitir criar/editar/ordenar coleções e livros, gerenciar `totalChapters`, `publicationState`, capítulos, notas, prefácios e sinopses; campos e validações consistentes. Preferir salvar como arquivos em GitHub; ao confirmar `published`, commit e rebuild da Cloudflare. Verificar suporte real das opções Sveltia CMS usadas em config.yml.

`/admin` sendo publicamente alcançável **não** significa que alguém possa editar: apenas usuários autenticados com permissão de escrita no repositório podem salvar. Se é requisito que a própria UI seja inacessível sem login, proteger `/admin*` por Cloudflare Access **com política configurada pelo proprietário**; o CMS sozinho não fornece proteção de página. Não afirmar proteção da rota se ela não estiver ativa.

Produzir `README.md` com passos de setup: GitHub repo, Cloudflare Pages static Next export (`out/`), Sveltia autenticação OAuth/alternativa suportada, quais campos o usuário deve preencher, como editar e publicar capítulo, como revisar preview local. Nunca commitar tokens, secrets ou emails de usuários.

## 8. Qualidade e critério de aceite

Verificar com `npm install`, `npm run build` e uma suíte mínima de testes. Incluir um script de validação de conteúdo.

Cenários obrigatórios:

1. Landing mostra coleções e estatísticas baseadas **apenas no conteúdo demonstrativo**, com aviso visível.
2. Biblioteca apresenta todos os 66 títulos nas quatro coleções e na ordem do projeto de referência.
3. Abrir Gênesis demonstrativo; abrir outro tomo demonstrativo; navegar no índice e voltar à estante.
4. Capítulos inexistentes ou rascunhos não aparecem no resultado público, nem por URL JSON previsível.
5. Adicionar capítulo via arquivos estruturados sem editar componentes e reconstruir catálogo/progresso.
6. Um versículo tem **30 notas demonstrativas**, todas acessíveis no rolo com filtro/rolagem no desktop e celular.
7. Um versículo muito longo atravessa mais de uma página sem perder texto.
8. Mudar fonte, tema, tamanho da janela e orientação preserva posição no mesmo livro/capítulo/versículo.
9. Teclado, foco, preferência de movimento reduzido, controle de som e acessibilidade básica funcionam.
10. Construção estática Next (`output:'export'`) gera rotas públicas válidas; sem dependências de servidor Next em produção.
11. Editor Sveltia tem config.yml válida, mas indicar separadamente quaisquer etapas de credenciais OAuth/Cloudflare que não podem ser testadas sem contas externas.
12. Documentar eventuais limitações do leitor 3D em hardware de entrada; disponibilizar modo estudo sem virada animada.

## 9. Ordem de implementação solicitada

**Etapa A — Base editorial:** scaffold Next, definição de coleções/livros/capítulos/notas, catálogo dos 66, dados fictícios, validação e geração de JSON estático.

**Etapa B — Biblioteca pública:** landing, biblioteca por quatro grupos, progresso, páginas de tomos, visualização em estantes e catálogo responsivo.

**Etapa C — Leitor:** capa, virada, tipografia, paginação segura, notas volumosas, temas, fonte, áudio e retomada.

**Etapa D — Administração:** Sveltia CMS, fluxo editorial, documentação de GitHub/OAuth/Cloudflare, proteção opcional da rota, checks do build.

**Etapa E — QA:** executar build e testes, corrigir overflow, validar mobile, anexar inventário dos recursos existentes e relatório das limitações conhecidas.

**Regra:** não considerar concluído por gerar uma página bonita; todos os testes essenciais devem ser satisfeitos, ou a limitação deve ser claramente declarada no README.

## 10. Recursos externos/decisões ainda dependentes do proprietário

- Conta GitHub e endereço do repositório escolhido; decisão pública/privada; permissões dos colaboradores.
- Conta Cloudflare e domínio de publicação (ou `*.pages.dev`); configuração de deploy, OAuth Worker e, caso desejado, Cloudflare Access.
- Autorização para divulgar/reproduzir a **tradução real** (até isso ocorrer, manter somente texto demonstrativo original).
- Confirmação dos direitos de uso das imagens, citações e áudios fornecidos.
- Conteúdos institucionais próprios: sinopse, créditos, e-mail/link de contato e destino real do botão de notificações (newsletter).
- **Opcional:** quatro artes finais por coleção, de preferência capas sem títulos fixos; o aplicativo pode iniciar com os JPEGs atuais.
- **Opcional:** cronograma/capítulos de publicação verificados, em vez de números estáticos do site original.

## 11. Notas para não introduzir ambiguidades

- O objetivo atual é **prova de conceito independente**, não substituir o site original, nem extrair sua tradução.
- A lista dos 66 e as quatro coleções iniciais são **requisitos funcionais**; expansibilidade não significa inventar conteúdo deuterocanônico no MVP.
- O progresso refere-se aos capítulos **carregados pela administração do protótipo**, não ao progresso em tempo real da tradução oficial.
- Uma nota pode ser tão longa e numerosa quanto a edição demandar; otimizar apresentação sem reduzir conteúdo.
- Não inferir licença ou consentimento editorial a partir de acesso público ao site.
