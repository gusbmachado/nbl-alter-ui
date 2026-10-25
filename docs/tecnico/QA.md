# Verificações e limites

Atualização: 22/10/2026. Este relatório descreve a prova de conceito, não uma publicação em produção.

## Escopo entregue

- Páginas internas de projeto e biografia, logo fornecida, timeline expansível e navegação de seções fixa.
- Duas faixas em loop, com volume baixo e preferência de silêncio persistida.

- Estante com acesso direto aos tomos disponíveis, filtro de leitura e navegação por coleção.
- Sala de leitura compacta, flipbook, notas e modo Estudo.
- Oficina sem login: verso, nota, prévia, armazenamento local, exportação, restauração e importação.
- README voltado ao uso, roteiro de demonstração e documentação técnica separada.
- Preparação do primeiro commit; nenhum commit ou envio remoto automático.

## Validação

- Checagem Astro/TypeScript: sem erros ou avisos.
- Testes TypeScript: 20 aprovados, incluindo importação de rascunhos inválidos, integridade da amostra e paginação.
- Importador Python: 5 testes aprovados; Gênesis 1–3 confere integralmente com a fonte, com 80 versos e 494 notas.
- Build estático e auditoria de exportação: aprovados, com 76 páginas HTML e 4 JSON de capítulos publicados.
- Playwright na prévia do build: regressão completa com 30 cenários aprovada; após o ajuste final do áudio, 8 cenários específicos aprovados (desktop e viewport móvel), incluindo decodificação dos arquivos reais.
- Servidor de desenvolvimento: os 6 cenários principais da oficina também passaram em desktop e móvel.
- Prévia contextual: abre o capítulo e verso selecionados; coberta na regressão final.
- Capturas de home, leitor, biblioteca e oficina revisadas; oficina sem rolagem horizontal no viewport móvel.

O navegador verifica o fluxo editar → salvar → recarregar → pré-visualizar → abrir nota → exportar → restaurar → importar, além de conferir que o JSON publicado permanece intacto. Também cobre armazenamento indisponível, arquivo incompatível e abertura direta pela estante.

## Limites conhecidos

- Autoplay depende do navegador; a primeira interação pode ser necessária. O som pausa com a aba oculta e pode interromper brevemente entre páginas. Os testes de política usam simulação, além de uma checagem de decodificação dos arquivos reais; não atestam qualidade acústica ou emenda imperceptível dos loops.
- Retrato e imagens institucionais fornecidos aplicados à biografia em 23/10/2026.

- Rascunhos são locais ao navegador; não há colaboração ou sincronização entre dispositivos/abas. Exporte para guardar ou compartilhar.
- A oficina permite alterar o texto e as notas da amostra, preservando a numeração dos capítulos e versos.
- O Sveltia remoto ainda precisa de repositório e autenticação. O editor experimental não substitui essa configuração.
- Chromium é usado nos testes desktop e móvel emulado. Safari/iOS, Firefox e dispositivos físicos ainda precisam de conferência.
- Fontes externas dependem da rede, com fallback. O tomo selecionado carrega todos os capítulos publicados; volumes completos exigem avaliação de desempenho.
- A referência visual v2 orienta o desenho; a avaliação de conforto e do processo editorial deve ser feita com o professor.

Os resultados de etapas anteriores estão em [Histórico de verificações](HISTORICO-VERIFICACOES.md).

## Atualização de 23/10/2026

Node ativo confirmado em 24.22.1; `.nvmrc`, `.node-version`, engines e instruções de publicação atualizados. Astro: 47 arquivos, sem erros ou avisos. Build e auditoria de exportação aprovados; 8 testes de apresentação/áudio aprovados em desktop e móvel após aplicação das imagens da biografia. O instalador global encontrou restrições de permissão em arquivos auxiliares do npm; a versão do executável Node foi verificada separadamente.

## Convergência visual com o protótipo v2

Leitor com barra única, índice e ajustes em diálogo lateral/gaveta; procedência e edição nos ajustes; dica dispensável; retomada contextual na capa. Home com CTA principal para a biblioteca e retomada por âncora completa. Notas preservam busca, categorias e retorno de foco, com filtros recolhidos. Áudio reunido em um menu; o padrão ligado solicitado pelo usuário foi preservado, divergindo da sugestão do documento de revisão. Paginação, conteúdo e modelos editoriais não foram reimplementados.

Astro: 47 arquivos, sem erros, avisos ou hints. O build e a auditoria estática passaram nas execuções de Playwright. Houve resultados aprovados para leitura, notas, reflow, oficina e apresentação; as sessões terminaram antes do relatório completo. A tentativa de repetir a suíte foi recusada no controle de aprovação. Não considerar esta etapa uma regressão completa aprovada. O painel de notas continua modal, alinhado à lateral em telas largas; não foi convertido em um painel simultâneo sem sobreposição. A navegação entre documentos também mantém a possível interrupção breve do áudio.

## Fidelidade visual e efeitos sonoros

Home: manifesto transcrito da contracapa fornecida pelo usuário, capas das quatro coleções, PNG flutuante, formulários demonstrativos de contato/correção. Removidas a barra secundária da home e as barras de apresentação das rotas Projeto/Tradutor. A oficina exibe a navegação principal e retorno contextual à passagem original. O leitor usa as cores do pergaminho v2, capitular no início de cada capítulo e ícones de notas com rótulo acessível; o mesmo CSS é aplicado à sonda de paginação. As notas preservam filtro, busca, rolagem e foco, com acabamento de rolo e abertura animada (desativada por movimento reduzido). Sons de tomo/folhas ligados por padrão; `sound: false` salvo continua válido.

Astro check: 49 arquivos sem erros/avisos. Build: 76 páginas estáticas; auditoria de exportação aprovada. Execução `node --import tsx --test tests/*.test.ts`: seis arquivos de testes aprovados. Auditoria de fontes aprovada. Os testes de navegador foram atualizados para os novos acessos e ampliados para formulários, retorno contextual e preferência sonora; as sessões foram encerradas pelo ambiente sem relatório completo. A validação visual/interativa desktop e móvel permanece pendente, especialmente para o efeito das capitulares na composição das folhas. Nenhum dado de livros, capítulos ou notas foi alterado nesta etapa.
