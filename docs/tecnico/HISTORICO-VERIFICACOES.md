# Verificação da prova de conceito

Atualização: 20/10/2026. Astro + React Islands + TypeScript + Sveltia CMS + Cloudflare Pages, com pnpm e StPageFlip 2.0.7.

## Resultados executados

| Verificação | Resultado |
|---|---|
| Astro / TypeScript (`astro check`) | 0 erros, 0 avisos |
| `pnpm test` | 18 testes passaram |
| `pnpm build` | 71 páginas estáticas; auditoria de exportação passou |
| `pnpm test:e2e --workers=2` | 12 cenários passaram no Chromium, desktop e viewport móvel |
| Conferência da importação de Gênesis | Fonte integral preservada; 80 versos e 494 notas |
| Testes Python do importador | 5 testes passaram |

O ambiente passou a ter Node disponível nesta atualização. StPageFlip foi instalado e `pnpm-lock.yaml` atualizado. O ambiente restrito exigiu execução dos testes fora do sandbox porque tsx e o servidor de prévia abrem sockets locais. Playwright usa a porta 4329 para preservar o servidor de desenvolvimento na porta 4321. Esses ajustes ambientais não são requisitos de hospedagem.

## Cobertura do navegador

- Biblioteca com 66 títulos, busca e capas fornecidas.
- Motor StPageFlip montado, abertura pela capa e capítulos compilados em um único tomo.
- Gesto de arrastar o canto no desktop efetivamente muda a folha.
- Seleção direta de capítulo/verso, fonte maior, tema noturno e retomada após fechar o tomo.
- Redimensionamento de desktop para 390 px preserva a âncora de leitura.
- Texto extenso de Salmos recomposto integralmente a partir das folhas; offsets e caracteres preservados também nos testes unitários.
- Fonte até 30 px, com verificação da área visível das folhas e ausência de rolagem horizontal.
- 30 notas, filtros de categoria, Escape e retorno do foco ao marcador, nos dois viewports.
- Armazenamento indisponível e movimento reduzido não impedem a leitura.
- Modo Estudo apresenta o verso extenso integralmente como texto contínuo.
- Rascunho de Gênesis 4 ausente da exportação pública.
- Home usa o asset 3D original, três camadas de profundidade e link para a biblioteca.

As capturas de home e leitor em desktop e viewport móvel foram inspecionadas. O teste de apresentação permite carregar as fontes externas; os demais cenários bloqueiam Google Fonts para também verificar a fonte de fallback. As capturas de cada execução ficam em `test-results/` e não são versionadas.

## Correções encontradas pela validação

A inicialização do motor e sua troca de orientação emitiam eventos antes de a nova composição estar pronta, podendo substituir a posição salva. Esses eventos intermediários agora são ignorados. Cópias visuais temporárias criadas pelo efeito ficam fora da navegação por foco e da árvore de acessibilidade. Controles de seleção têm nomes acessíveis explícitos.

## Limites e verificações externas pendentes

- Os testes móveis usam Chromium com viewport e entrada emulada; Safari/iOS real, Firefox e gesto de toque em aparelho físico ainda precisam ser conferidos.
- O tomo selecionado carrega todos os seus capítulos publicados. A demonstração tem Gênesis 1–3 e Salmos 1; um livro completo com milhares de notas exige avaliar desempenho e composição incremental.
- Meddon depende da rede; na ausência da fonte externa, o navegador usa fallback e recompõe o livro quando a fonte chega. Garamond e modo Estudo são alternativas de leitura.
- Autenticação, edição e publicação no Sveltia ainda dependem da configuração do repositório e das credenciais do responsável.
- Não houve implantação no Cloudflare Pages nem alteração no site oficial.

A referência v2 foi preservada. Salmos contém texto fictício de teste, claramente identificado; Gênesis contém a amostra real fornecida. O roteiro da apresentação e os pontos de extensão estão no README.

## Correção de abertura — 21/10/2026

Reproduzidos no servidor de desenvolvimento: `/admin/` retornava 404; a hidratação do leitor falhava com HTTP 504 `Outdated Optimize Dep` em react-markdown; após recompor o conteúdo, os JSON de capítulos também retornavam 404.

Correções: editor movido para uma rota Astro, dependências do leitor incluídas na pré-otimização Vite e capítulos publicados servidos por rotas Astro que geram JSON estático no build. A capa inteira agora abre o tomo. O tamanho do contêiner e da janela participam da recomposição, evitando que eventos de navegação fiquem permanentemente ignorados após redimensionamentos pequenos.

Validação desta correção: checagem Astro com zero erros/avisos, build e auditoria de exportação aprovados, 16 cenários Playwright aprovados em desktop e viewport móvel. A tela real do Sveltia carregou em `/admin/` no servidor de desenvolvimento. Não foi realizada autenticação remota ou gravação editorial.

A investigação confirmou que `trailingSlash: always` exigia `/dados/genesis/1.json/` no desenvolvimento, enquanto o leitor solicitava `/dados/genesis/1.json`. A configuração foi alterada para `ignore`, preservando os links HTML com barra final e aceitando os JSON sem ela. Após a correção, a abertura de Gênesis e Salmos e o carregamento do Sveltia foram confirmados no servidor real `localhost:4321`.

Regressão adicional contra o servidor de desenvolvimento existente (`NBL_TEST_BASE_URL=http://localhost:4321`): **16/16 cenários passaram**, além dos 16/16 aprovados na prévia do build. O servidor auxiliar de diagnóstico foi encerrado; o original permanece na porta 4321.
