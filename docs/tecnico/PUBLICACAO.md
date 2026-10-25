# Publicação e Sveltia

## Local

`pnpm dev` permite usar o site e a oficina sem login. O Sveltia em `/admin/` também oferece **Work with Local Repository** em navegadores compatíveis com a File System Access API, como Chrome/Edge. Esse fluxo solicita acesso à pasta do projeto com Git inicializado e grava arquivos reais. A oficina em `/experimentar/genesis/` dispensa esse acesso e não modifica arquivos editoriais.

## GitHub + Cloudflare Pages

1. Crie um repositório e envie o código-fonte com `pnpm-lock.yaml`. Não envie `dist/` ou `node_modules/`.
2. Substitua `backend.repo` em `public/admin/config.yml` por `proprietario/repositorio`. Confira `backend.branch`.
3. Conecte o repositório ao Cloudflare Pages: raiz na pasta do `package.json`, build `pnpm build`, saída `dist`. Use Node 24.22.1 e pnpm 10.18.3. Configure `NODE_VERSION=24.22.1` no Cloudflare Pages; `.nvmrc` e `.node-version` também registram essa versão.
4. Configure autenticação do Sveltia. Token permite o teste inicial; OAuth com Sveltia CMS Authenticator em um Worker oferece login pelo GitHub para os editores. O endereço do autenticador vai em `backend.base_url`; as credenciais privadas ficam no serviço de autenticação.
5. Teste uma edição pequena com uma conta autorizada, confira o commit, o build e o conteúdo publicado.

O fluxo é: Sveltia → commit no GitHub → build no Cloudflare → site atualizado. A Vercel pode hospedar a mesma saída estática; autenticação do CMS continua separada.

## Referências oficiais

- [Fluxo local](https://sveltiacms.app/en/docs/workflows/local)
- [Backend GitHub e autenticação](https://sveltiacms.app/en/docs/backends/github)
- [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)
- [Astro no Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Astro na Vercel](https://vercel.com/docs/frameworks/frontend/astro)

## Situação

A configuração ainda usa o repositório de exemplo. Nenhuma conta, autenticação remota ou hospedagem foi provisionada nesta preparação. O site e a oficina podem ser apresentados localmente.
