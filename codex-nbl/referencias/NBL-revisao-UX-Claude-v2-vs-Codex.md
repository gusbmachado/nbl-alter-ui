# Nossa Bíblia Livre — plano de convergência de UX (Claude v2 × Codex)

## Materiais analisados
- `Nossa Bíblia Livre (protótipo) - v2.html` — referência principal para estética e fluidez do leitor.
- `nbl-review.zip` — referência principal para arquitetura Astro/React, tipagem, paginação orientada a versículo, conteúdo e notas.

**Limitação:** o ZIP recebido é um recorte de revisão, não um repositório executável completo: contém importações para `src/lib/content`, `src/lib/catalog`, `src/lib/types`, `src/lib/folio`, `src/lib/storage`, `src/lib/position`, arquivos de conteúdo e URLs de áudio não incluídos no ZIP. Não presumir que as ausências existam no repositório de trabalho original.

## Princípio obrigatório
**Preservar o motor técnico do Codex e recuperar a hierarquia visual de Claude v2.** Não copiar a implementação de paginação de Claude v2, que pagina por blocos e pode truncar versículos longos. Não perder âncoras por capítulo/versículo/offset, a modelagem de notas ou a administração editorial.

## P0 — Leitor, sem redundâncias
1. Estrutura padrão: única barra compacta (`← Biblioteca` | título do tomo | `Índice` | `Ajustes`) → códice central maximizado → barra inferior (`Anterior` | progresso | `Próxima`).
2. Retirar da área primária: selo de protótipo repetido, link de edição experimental, controles de versículo sempre abertos, instrução persistente de arrastar folha, botões repetidos de capítulos, atalho redundante de fechar e continuar, procedência extensa repetida sob o livro. Mover para menus apropriados ou exibir somente quando relevante.
3. `Índice` em painel lateral no desktop e gaveta/modal no celular, com seleção de capítulo e opcionalmente versículo. A navegação não deve causar nova montagem desnecessária do FlipBook.
4. Exibir dica gestual somente na primeira leitura, dispensável; manter atalhos de teclado e indicadores acessíveis.
5. Livro deve ser foco visual. Reservar espaço suficiente para abertura dupla no desktop e página única no celular, sem controles excederem o viewport.
6. `Continuar leitura` apenas quando existe posição salva significativa; acessar a capa por comando discreto, não por botão sempre visível.

## P0 — Áudio unificado
1. Existe `Ambience.astro` global e existe controle de `sound`/`volume` dentro de `Reader.tsx` para folhas/capa; consolidar experiência em **um único menu de áudio**.
2. Um só tema ambiente opcional (`Ancient Library`) e no máximo uma faixa musical opcional; não iniciar música e ambiente simultaneamente por padrão.
3. Som **desligado por padrão**, ativação explícita e persistência da escolha. Não tentar tocar em qualquer pointerup do documento antes de consentimento claro.
4. Controles independentes de volume de ambiente/música e efeitos mecânicos, se fizer sentido; UX compacta e estado compartilhado entre rotas, evitando reinícios.
5. Ausência dos arquivos de áudio no ZIP: apresentar fallback silencioso sem quebrar a interface.

## P1 — Redundâncias de navegação e conteúdo
1. Home deve ter um CTA primário: **Explorar biblioteca**; secundário: **Continuar leitura**, somente quando houver progresso.
2. `Ler Gênesis`, `Experimentar edição` e outros atalhos editoriais devem ficar em áreas secundárias/contextuais, não competir com a biblioteca na home.
3. Evitar repetir miniaturas de capa da mesma coleção na home, biblioteca, detalhe e leitor quando não agregam contexto; manter uma apresentação hero e pistas cromáticas consistentes.
4. `Projeto` e `Tradutor` podem continuar como rotas informativas, mas resumir as seções duplicadas da home e remover slogans/avisos repetidos.
5. Aviso de protótipo não oficial: uma indicação persistente, discreta e acessível; procedência específica apenas quando muda de fonte ou no painel informativo.
6. Diferenciar andamento do protótipo de andamento oficial; não dar a entender que 66 tomos estão concluídos.

## P1 — Notas
1. Preservar `Notes.tsx`, filtros por categoria, busca, 30+ notas por versículo e referência estável.
2. Apresentação padrão como **rolo de pergaminho** contextual, inspirada em Claude v2; no desktop lateral sem cobrir a página, no celular drawer acessível.
3. Quando houver muitas notas: lista rolável dentro do painel, título `Livro capítulo:versículo`, categorias colapsáveis, busca opcional (não mostrar todos os filtros ao abrir).
4. Fechar ao trocar de tomo/capítulo; retorno de foco ao marcador que abriu a nota.
5. Não alterar a posição de leitura ao abrir/fechar notas.

## P1 — Robustez de leitura
1. Preservar a paginação e a normalização de âncoras orientadas a capítulo/versículo/offset da implementação Codex.
2. Alteração de fonte/zoom, orientação ou viewport repagina e restaura a mesma âncora sem cortes.
3. O modo estudo é alternativa opcional, não competir visualmente com o leitor por padrão.
4. Auditar que a mudança de nota, volume e outros controles que não alteram a geometria NÃO remontem o motor StPageFlip e não provoquem flicker.
5. Páginas do mesmo tomo carregadas sob demanda quando necessário; exibir estados de carregamento discretos.
6. Testar mobile estreito, desktop largo, zoom 200%, toque, teclado e `prefers-reduced-motion`.

## P2 — Design system
- Reter textura de pergaminho, encadernações cromáticas e linguagem ornamental de Claude v2.
- Reservar Cinzel para títulos e controles especiais, Meddon para capitulares/detalhes. Usar fonte serifada legível em textos longos por padrão.
- Criar tokens de espaçamento e tamanho de controles; evitar cabeçalhos duplos, faixas sucessivas e cartões demasiadamente repetidos.
- A identidade editorial da biblioteca deve permanecer Torá / Profetas / Escritos / Novo Testamento Grego, com 66 livros iniciais e expansão futura configurável.

## Arquivos prioritários de implementação
- `src/components/Reader.tsx`
- `src/components/FlipBook.tsx`
- `src/components/Notes.tsx`
- `src/components/Ambience.astro`
- `src/layouts/Layout.astro`
- `src/pages/index.astro`, `src/pages/biblioteca.astro`, `src/pages/livros/[slug].astro`
- `src/styles/reader.css`, `src/styles/global.css`, `src/styles/home.css`, `src/styles/experience.css`

## Critérios de aceite
- Entrar na biblioteca e abrir tomo em poucos cliques, sem retornar desnecessariamente à home.
- A tela do leitor nunca duplica seletor de capítulo, título ou controles equivalentes.
- O livro ocupa o centro visual e é legível no celular.
- Todos os comandos secundários ficam em um único painel de ajustes, sem perda de acessibilidade.
- Notas numerosas continuam acessíveis sem obstruir leitura permanentemente.
- Fonte/tema/redimensionamento preservam referência lógica da leitura.
- Nenhum texto bíblico é truncado; conteúdo real não é atribuído indevidamente ao protótipo.
- Áudio não toca sem consentimento e não reinicia desnecessariamente ao navegar.
- Build e testes são executados no repositório completo.

## Prompt sugerido ao Codex
> Revise a UX do repositório Nossa Bíblia Livre usando o protótipo Claude v2 como referência de hierarquia visual, ritmo e imersão, não como referência de arquitetura interna. Mantenha os modelos tipados, publicação editorial e paginação robusta atuais. Aplique os itens P0 e P1 deste documento, removendo duplicações de controles, avisos e CTAs; centralize o códice, crie um índice recolhível, una as preferências sonoras e adapte o painel de notas ao rolo contextual. Evite refatorações não relacionadas. Teste desktop/mobile, persistência da posição de leitura, notas numerosas, redimensionamento, áudio e acessibilidade. Entregue lista de arquivos modificados, screenshots antes/depois e resultados da compilação.
