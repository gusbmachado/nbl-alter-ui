# Nossa Biblioteca Livre

Uma proposta de biblioteca digital para ler a tradução de Osvaldo Luiz Ribeiro como um livro: escolher um tomo na estante, virar suas páginas e consultar as notas.

Este projeto é uma **prova de conceito independente**, preparada para apresentação e discussão com o professor. A amostra de Gênesis 1–3 foi fornecida para o protótipo. Salmos contém texto fictício usado nos testes. A interface não é o site oficial.

## O que experimentar

- **Biblioteca:** os tomos dourados abrem diretamente; os demais mostram informações sobre o livro.
- **Leitura:** vire as páginas, escolha um capítulo, abra notas ou alterne para o modo Estudo.
- **Oficina de edição:** modifique uma cópia de um verso, acrescente notas e confira o resultado no livro, sem login.
- **Rascunhos:** salve neste navegador, exporte um arquivo e importe-o em outro computador. Nada é publicado automaticamente.

O som ambiente começa habilitado, em volume baixo, quando o navegador permite. Use **Desligar som ambiente** para silenciar; a escolha fica salva neste navegador.

A oficina é uma interface experimental própria. O **Sveltia CMS** é o editor separado destinado ao fluxo real de publicação pelo repositório.

## Abrir no computador

É necessário ter **Node.js 24.22.1 (linha 24 LTS)** e **pnpm 10.18.3** instalados. Na pasta do projeto:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra no navegador o endereço mostrado no terminal, normalmente `http://localhost:4321`.

| Endereço | O que abre |
|---|---|
| `/` | Apresentação do projeto |
| `/projeto/` | Apresentação da proposta |
| `/tradutor/` | Biografia com trajetória interativa |
| `/biblioteca/` | Estante dos livros |
| `/ler/genesis/` | Amostra de Gênesis |
| `/experimentar/genesis/` | Oficina aberta de edição |
| `/admin/` | Sveltia CMS |

Use o endereço do servidor. Abrir `dist/index.html` diretamente não inicia o aplicativo.

## Apresentar em cinco minutos

1. Entre na Biblioteca e abra Gênesis pela lombada dourada.
2. Vire uma página e abra uma nota.
3. Abra **Ajustes de leitura → Experimentar edição** e altere um verso.
4. Adicione uma nota e clique em **Pré-visualizar no livro**.
5. Exporte o rascunho, restaure a amostra e importe o arquivo para recuperar o trabalho.

O roteiro completo está em [Como testar](docs/COMO-TESTAR.md). As alterações da oficina ficam apenas naquele navegador; exporte para guardar ou compartilhar. Elas nunca substituem a amostra original nem são atribuídas ao tradutor.

## Publicar e editar de verdade

Para uma demonstração local, não são necessários GitHub, autenticação ou banco de dados. Para publicação com edição remota, a arquitetura prevista é **GitHub + Sveltia CMS + Cloudflare Pages**; o site estático também pode ser hospedado na Vercel.

O Sveltia ainda precisa receber os dados do repositório e a configuração de autenticação. A oficina aberta permite avaliar a experiência antes dessa etapa. Consulte [Publicação e Sveltia](docs/tecnico/PUBLICACAO.md).

## Para quem vai manter o código

Astro gera as páginas e os arquivos de conteúdo. React cuida do leitor e da oficina. TypeScript ajuda a verificar os dados. StPageFlip realiza a virada das páginas.

- [Arquitetura e organização](docs/tecnico/ARQUITETURA.md)
- [Preparação do primeiro commit](docs/tecnico/PRIMEIRO-COMMIT.md)
- [Verificações e limitações](docs/tecnico/QA.md)

Os textos, imagens e protótipos de referência permanecem preservados. Documentação de implementação e estados de entrega ficam em `docs/tecnico/`.
