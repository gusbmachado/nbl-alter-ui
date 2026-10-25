# Preparação do primeiro commit

## Escopo sugerido

**Mensagem:** `feat: cria biblioteca com flipbook e oficina editorial de demonstração`

Inclui Astro + React + TypeScript, catálogo, amostra de Gênesis, ensaio fictício de Salmos, leitor, oficina local, configuração Sveltia, assets, referências, documentação e testes.

A estrutura preserva as fontes fornecidas em `codex-nbl/` e `ref-text.txt`. O README apresenta o projeto; `docs/COMO-TESTAR.md` guia a demonstração; detalhes de manutenção e estados de entrega ficam neste diretório.

## Arquivos versionados

- `src/`, `public/`, `scripts/`, `tests/`
- `docs/`, `README.md`, `codex-nbl/`, `ref-text.txt`
- `package.json`, `pnpm-lock.yaml`, configurações Astro/TypeScript/Playwright
- `.gitignore`, `.nvmrc`

Gerados e locais: `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`, caches Python e arquivos `.env*` são ignorados. Os rascunhos da oficina ficam no navegador; não fazem parte do commit.

## Conferência

Execute os comandos de validação descritos em [Arquitetura](ARQUITETURA.md). Confira [QA](QA.md) para saber quais foram executados nesta entrega e suas limitações.

Depois de revisar o conteúdo:

```sh
git status --short
git add .gitignore .nvmrc README.md astro.config.mjs package.json pnpm-lock.yaml playwright.config.ts tsconfig.json src public scripts tests docs codex-nbl ref-text.txt
git diff --cached --stat
git diff --cached --check
git commit -m "feat: cria biblioteca com flipbook e oficina editorial de demonstração"
```

Esta entrega prepara os arquivos e a mensagem. Não cria commit, repositório remoto nem publicação automaticamente.
