# Nossa Bíblia Livre: guia de construção

Tradução livre e independente da Bíblia, publicada aos poucos, **um tomo por livro** e **um capítulo por arquivo**, com:

- **Landing page** de apresentação (capa de grimório, andamento do projeto)
- **Biblioteca + leitor** em uma única página (`/ler`): estantes com os 66 tomos; ao escolher um, o livro abre na capa, com páginas de pergaminho, fonte de pena (Meddon), sons de folhas e **notas de tradução num rolo**
- **Editor restrito** (`/admin`) onde cada capítulo e suas notas são editados separadamente, sem mexer em código

Custo: **zero** (ferramentas e hospedagem gratuitas). O visual e o comportamento foram validados no protótipo "Nossa Bíblia Livre"; este guia traz o mesmo código adaptado a um projeto real.

> Os comandos e versões abaixo são os vigentes na data de escrita. Se algo divergir, consulte a documentação de cada ferramenta.

---

## 1. Arquitetura

```
Você (editor)                              Leitores
     │                                         │
 /admin (Sveltia CMS)                      /  (landing)
     │ login GitHub                        /ler (biblioteca + leitor)
     ▼                                         ▲
Repositório GitHub ──push──▶ Cloudflare Pages ──build──▶ site estático
(capítulos .md)                (Astro)                    + /dados/<livro>.json
```

| Peça | Ferramenta | Função |
|---|---|---|
| Site | **Astro** | Gera as páginas e um arquivo JSON por tomo |
| Editor | **Sveltia CMS** (compatível com Decap CMS) | Edição em `/admin`, grava no GitHub |
| Leitor | **StPageFlip** (`page-flip`) | Efeito de virar página |
| Hospedagem | **Cloudflare Pages** | Build automático a cada commit |
| Acesso restrito | Permissão do repositório GitHub | Só colaboradores conseguem salvar |

**Por que um JSON por tomo?** A Bíblia inteira é grande demais para carregar de uma vez. A página `/ler` embute só a lista dos 66 livros; o texto de um tomo é buscado (`/dados/genesis.json`) quando o leitor o abre.

**Fluxo de publicação:** você edita no `/admin` → o CMS faz um commit → a Cloudflare reconstrói o site (≈1 min) → o capítulo aparece no tomo.

---

## 2. Pré-requisitos

- **Node.js 20+** (`node -v`), **Git** e conta no **GitHub**
- Conta gratuita na **Cloudflare** (para o deploy)
- **Chrome/Edge** (o modo de edição local do Sveltia usa a File System Access API)
- **ffmpeg** e **Python + Pillow** só se quiser refazer os ativos (capa e áudios); o arquivo `assets-projeto.zip` já os traz prontos

---

## 3. Criando o projeto

```bash
npm create astro@latest nossa-biblia-livre -- --template minimal
cd nossa-biblia-livre
npm install page-flip marked
git init
```

Descompacte o `assets-projeto.zip` **na raiz do projeto**. Ele cria `public/img/` e `public/audio/` (seção 5).

Estrutura final:

```
nossa-biblia-livre/
├── public/
│   ├── admin/
│   │   ├── index.html          # carrega o editor
│   │   └── config.yml          # campos do editor (seção 7)
│   ├── img/
│   │   ├── capa.jpg
│   │   └── contracapa.jpg
│   └── audio/
│       ├── tomo.mp3            # abrir/fechar o livro
│       └── folhas.mp3          # virar página / rolo
└── src/
    ├── content.config.ts       # esquema dos capítulos (seção 6)
    ├── content/capitulos/      # um arquivo por capítulo: genesis-1.md ...
    ├── data/livros.json        # os 66 livros (seção 6)
    ├── layouts/Base.astro
    ├── pages/
    │   ├── index.astro         # landing
    │   ├── ler.astro           # biblioteca + leitor
    │   └── dados/[slug].json.ts  # JSON de cada tomo
    └── styles/global.css
```

---

## 4. Fontes

| Uso | Fonte (Google Fonts) |
|---|---|
| Texto dos versículos, inicial ornamentada, "Capítulo N", rolo | **Meddon** (letra de pena; só tem peso 400, então evite negrito) |
| Títulos, botões, lombadas, placa do tomo | **Cinzel** |

O `<link>` das duas está no `Base.astro` (seção 8). Alinhe o texto das páginas à esquerda: o Meddon fica com espaços irregulares quando justificado.

---

## 5. Ativos: capa, contracapa e sons

O `assets-projeto.zip` contém:

| Arquivo | Origem |
|---|---|
| `public/img/capa.jpg` | Frente recortada da sua imagem de referência (640 px de largura, JPEG) |
| `public/img/contracapa.jpg` | Contracapa recortada da mesma imagem |
| `public/audio/tomo.mp3` | `book-open-closing.mp3` cortado (0,5 s): usado ao **abrir** o tomo e, mais grave, ao **fechar** |
| `public/audio/folhas.mp3` | `pages-passing.mp3` cortado (≈1 s) e com volume corrigido: usado em cada **virada de página** e no **rolo de notas** |

**Como foram feitos** (caso queira refazer com outros arquivos):

```python
from PIL import Image
im = Image.open('referencia.png').convert('RGB')
front = im.crop((856, 36, 1500, 980))   # ajuste as caixas à sua imagem
back  = im.crop((38, 36, 658, 980))
for c, nome in [(front, 'capa.jpg'), (back, 'contracapa.jpg')]:
    h = round(c.size[1] * 640 / c.size[0])
    c.resize((640, h)).save(nome, quality=82, optimize=True, progressive=True)
```

```bash
ffmpeg -y -i book-open-closing.mp3 -ss 0 -t 0.5 \
  -af "afade=t=in:d=0.004,afade=t=out:st=0.34:d=0.16,volume=-1dB" -ac 2 -b:a 128k tomo.mp3
ffmpeg -y -i pages-passing.mp3 -ss 0.76 -t 0.96 \
  -af "afade=t=in:d=0.05,afade=t=out:st=0.7:d=0.26,volume=7dB,alimiter=limit=0.9" -ac 1 -b:a 128k folhas.mp3
```

**Sobre o som:** os navegadores só liberam áudio depois de um toque do usuário. Por isso a navegação entre a biblioteca e o tomo acontece **dentro da mesma página** (`/ler`): o toque na lombada libera o som e o "abrir tomo" toca. O botão "Som ligado/desligado" fica no topo e a escolha é lembrada.

**Sobre a capa:** o título "Nossa Bíblia Livre" já está na imagem. Em cada tomo, o leitor sobrepõe uma **placa dourada** com o nome do livro (ex.: "Gênesis") perto da borda inferior.

---

## 6. Modelo de conteúdo

### 6.1 Os 66 livros: `src/data/livros.json`

Lista fixa (nome, testamento e o *slug* usado nos arquivos). Um tomo passa a brilhar na estante sozinho quando recebe o primeiro capítulo publicado.

```json
[
  { "n": "Gênesis", "t": "AT", "slug": "genesis" },
  { "n": "Êxodo", "t": "AT", "slug": "exodo" },
  { "n": "Levítico", "t": "AT", "slug": "levitico" },
  { "n": "Números", "t": "AT", "slug": "numeros" },
  { "n": "Deuteronômio", "t": "AT", "slug": "deuteronomio" },
  { "n": "Josué", "t": "AT", "slug": "josue" },
  { "n": "Juízes", "t": "AT", "slug": "juizes" },
  { "n": "Rute", "t": "AT", "slug": "rute" },
  { "n": "1 Samuel", "t": "AT", "slug": "1-samuel" },
  { "n": "2 Samuel", "t": "AT", "slug": "2-samuel" },
  { "n": "1 Reis", "t": "AT", "slug": "1-reis" },
  { "n": "2 Reis", "t": "AT", "slug": "2-reis" },
  { "n": "1 Crônicas", "t": "AT", "slug": "1-cronicas" },
  { "n": "2 Crônicas", "t": "AT", "slug": "2-cronicas" },
  { "n": "Esdras", "t": "AT", "slug": "esdras" },
  { "n": "Neemias", "t": "AT", "slug": "neemias" },
  { "n": "Ester", "t": "AT", "slug": "ester" },
  { "n": "Jó", "t": "AT", "slug": "jo" },
  { "n": "Salmos", "t": "AT", "slug": "salmos" },
  { "n": "Provérbios", "t": "AT", "slug": "proverbios" },
  { "n": "Eclesiastes", "t": "AT", "slug": "eclesiastes" },
  { "n": "Cantares", "t": "AT", "slug": "cantares" },
  { "n": "Isaías", "t": "AT", "slug": "isaias" },
  { "n": "Jeremias", "t": "AT", "slug": "jeremias" },
  { "n": "Lamentações", "t": "AT", "slug": "lamentacoes" },
  { "n": "Ezequiel", "t": "AT", "slug": "ezequiel" },
  { "n": "Daniel", "t": "AT", "slug": "daniel" },
  { "n": "Oseias", "t": "AT", "slug": "oseias" },
  { "n": "Joel", "t": "AT", "slug": "joel" },
  { "n": "Amós", "t": "AT", "slug": "amos" },
  { "n": "Obadias", "t": "AT", "slug": "obadias" },
  { "n": "Jonas", "t": "AT", "slug": "jonas" },
  { "n": "Miqueias", "t": "AT", "slug": "miqueias" },
  { "n": "Naum", "t": "AT", "slug": "naum" },
  { "n": "Habacuque", "t": "AT", "slug": "habacuque" },
  { "n": "Sofonias", "t": "AT", "slug": "sofonias" },
  { "n": "Ageu", "t": "AT", "slug": "ageu" },
  { "n": "Zacarias", "t": "AT", "slug": "zacarias" },
  { "n": "Malaquias", "t": "AT", "slug": "malaquias" },
  { "n": "Mateus", "t": "NT", "slug": "mateus" },
  { "n": "Marcos", "t": "NT", "slug": "marcos" },
  { "n": "Lucas", "t": "NT", "slug": "lucas" },
  { "n": "João", "t": "NT", "slug": "joao" },
  { "n": "Atos", "t": "NT", "slug": "atos" },
  { "n": "Romanos", "t": "NT", "slug": "romanos" },
  { "n": "1 Coríntios", "t": "NT", "slug": "1-corintios" },
  { "n": "2 Coríntios", "t": "NT", "slug": "2-corintios" },
  { "n": "Gálatas", "t": "NT", "slug": "galatas" },
  { "n": "Efésios", "t": "NT", "slug": "efesios" },
  { "n": "Filipenses", "t": "NT", "slug": "filipenses" },
  { "n": "Colossenses", "t": "NT", "slug": "colossenses" },
  { "n": "1 Tessalonicenses", "t": "NT", "slug": "1-tessalonicenses" },
  { "n": "2 Tessalonicenses", "t": "NT", "slug": "2-tessalonicenses" },
  { "n": "1 Timóteo", "t": "NT", "slug": "1-timoteo" },
  { "n": "2 Timóteo", "t": "NT", "slug": "2-timoteo" },
  { "n": "Tito", "t": "NT", "slug": "tito" },
  { "n": "Filemom", "t": "NT", "slug": "filemom" },
  { "n": "Hebreus", "t": "NT", "slug": "hebreus" },
  { "n": "Tiago", "t": "NT", "slug": "tiago" },
  { "n": "1 Pedro", "t": "NT", "slug": "1-pedro" },
  { "n": "2 Pedro", "t": "NT", "slug": "2-pedro" },
  { "n": "1 João", "t": "NT", "slug": "1-joao" },
  { "n": "2 João", "t": "NT", "slug": "2-joao" },
  { "n": "3 João", "t": "NT", "slug": "3-joao" },
  { "n": "Judas", "t": "NT", "slug": "judas" },
  { "n": "Apocalipse", "t": "NT", "slug": "apocalipse" }
]
```

### 6.2 Esquema dos capítulos: `src/content.config.ts`

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import livros from './data/livros.json';

const slugs = livros.map((l) => l.slug) as [string, ...string[]];

const capitulos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/capitulos' }),
  schema: z.object({
    livro: z.enum(slugs),
    numero: z.number().int().min(1),
    status: z.enum(['rascunho', 'publicado']).default('rascunho'),
    notas: z
      .array(
        z.object({
          versiculo: z.number().int().min(1),
          tipo: z
            .enum(['Literal', 'Variante', 'Jogo de palavras', 'Contexto', 'Referência cruzada'])
            .default('Literal'),
          texto: z.string().min(1),
        })
      )
      .default([]),
  }),
});

export const collections = { capitulos };
```

### 6.3 Um capítulo: `src/content/capitulos/genesis-1.md`

```md
---
livro: genesis
numero: 1
status: publicado
notas:
  - versiculo: 1
    tipo: Literal
    texto: 'Heb. *bereshit*, “no início de”. A forma sugere “ao começar…”.'
  - versiculo: 1
    tipo: Variante
    texto: 'Algumas traduções leem “Quando Deus começou a criar…”, ligando o v. 1 ao v. 2.'
  - versiculo: 2
    tipo: Literal
    texto: '“Informe e vazia” traduz *tohu vavohu*, expressão sonora de sentido incerto.'
---
No princípio, Deus criou o céu e a terra.
A terra era informe e vazia; havia treva sobre o abismo, e o sopro de Deus pairava sobre as águas.
Então Deus disse: “Haja luz!” E a luz passou a existir.
```

**Regras do corpo do capítulo:**

- **Uma linha = um versículo**, na ordem. Não digite os números: a linha 1 é o versículo 1, a linha 2 é o versículo 2 e assim por diante.
- Linhas em branco são ignoradas.
- Aceita Markdown de linha (`*itálico*`). O primeiro versículo ganha a inicial ornamentada.
- `status: rascunho` mantém o capítulo fora do site.

---

## 7. O editor restrito (`/admin`)

### 7.1 `public/admin/index.html`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Editor da tradução</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

> Fixe a versão do script (ex.: `@sveltia/cms@0.x.y`) antes de publicar, para que uma atualização inesperada não quebre o editor.

### 7.2 `public/admin/config.yml`

```yaml
backend:
  name: github
  repo: SEU_USUARIO/nossa-biblia-livre   # <- troque
  branch: main
  # base_url: https://SEU-WORKER.workers.dev   # login OAuth em produção (seção 11)

# Em desenvolvimento local, o Sveltia oferece "Work with Local Repository"
# (Chrome/Edge): edita direto a pasta do projeto, sem GitHub.

locale: pt
media_folder: public/uploads
public_folder: /uploads

collections:
  - name: capitulos
    label: Capítulos
    label_singular: Capítulo
    folder: src/content/capitulos
    create: true
    extension: md
    format: frontmatter
    slug: "{{livro}}-{{numero}}"
    sortable_fields: ["livro", "numero", "status"]
    summary: "{{livro}} {{numero}} · {{status}}"
    fields:
      - label: Livro
        name: livro
        widget: select
        options:
          - { label: Gênesis, value: genesis }
          - { label: Êxodo, value: exodo }
          - { label: Levítico, value: levitico }
          - { label: Números, value: numeros }
          - { label: Deuteronômio, value: deuteronomio }
          - { label: Josué, value: josue }
          - { label: Juízes, value: juizes }
          - { label: Rute, value: rute }
          - { label: 1 Samuel, value: 1-samuel }
          - { label: 2 Samuel, value: 2-samuel }
          - { label: 1 Reis, value: 1-reis }
          - { label: 2 Reis, value: 2-reis }
          - { label: 1 Crônicas, value: 1-cronicas }
          - { label: 2 Crônicas, value: 2-cronicas }
          - { label: Esdras, value: esdras }
          - { label: Neemias, value: neemias }
          - { label: Ester, value: ester }
          - { label: Jó, value: jo }
          - { label: Salmos, value: salmos }
          - { label: Provérbios, value: proverbios }
          - { label: Eclesiastes, value: eclesiastes }
          - { label: Cantares, value: cantares }
          - { label: Isaías, value: isaias }
          - { label: Jeremias, value: jeremias }
          - { label: Lamentações, value: lamentacoes }
          - { label: Ezequiel, value: ezequiel }
          - { label: Daniel, value: daniel }
          - { label: Oseias, value: oseias }
          - { label: Joel, value: joel }
          - { label: Amós, value: amos }
          - { label: Obadias, value: obadias }
          - { label: Jonas, value: jonas }
          - { label: Miqueias, value: miqueias }
          - { label: Naum, value: naum }
          - { label: Habacuque, value: habacuque }
          - { label: Sofonias, value: sofonias }
          - { label: Ageu, value: ageu }
          - { label: Zacarias, value: zacarias }
          - { label: Malaquias, value: malaquias }
          - { label: Mateus, value: mateus }
          - { label: Marcos, value: marcos }
          - { label: Lucas, value: lucas }
          - { label: João, value: joao }
          - { label: Atos, value: atos }
          - { label: Romanos, value: romanos }
          - { label: 1 Coríntios, value: 1-corintios }
          - { label: 2 Coríntios, value: 2-corintios }
          - { label: Gálatas, value: galatas }
          - { label: Efésios, value: efesios }
          - { label: Filipenses, value: filipenses }
          - { label: Colossenses, value: colossenses }
          - { label: 1 Tessalonicenses, value: 1-tessalonicenses }
          - { label: 2 Tessalonicenses, value: 2-tessalonicenses }
          - { label: 1 Timóteo, value: 1-timoteo }
          - { label: 2 Timóteo, value: 2-timoteo }
          - { label: Tito, value: tito }
          - { label: Filemom, value: filemom }
          - { label: Hebreus, value: hebreus }
          - { label: Tiago, value: tiago }
          - { label: 1 Pedro, value: 1-pedro }
          - { label: 2 Pedro, value: 2-pedro }
          - { label: 1 João, value: 1-joao }
          - { label: 2 João, value: 2-joao }
          - { label: 3 João, value: 3-joao }
          - { label: Judas, value: judas }
          - { label: Apocalipse, value: apocalipse }
      - { label: Capítulo, name: numero, widget: number, value_type: int, min: 1 }
      - label: Status
        name: status
        widget: select
        options: [rascunho, publicado]
        default: rascunho
      - label: Versículos
        name: body
        widget: text
        hint: "Um versículo por linha, em ordem. Não digite os números: a linha 1 é o versículo 1. Use *itálico* se precisar."
      - label: Notas de tradução
        name: notas
        widget: list
        label_singular: Nota
        required: false
        summary: "v. {{fields.versiculo}} · {{fields.tipo}}"
        fields:
          - { label: Versículo, name: versiculo, widget: number, value_type: int, min: 1, hint: "Número da linha no campo Versículos." }
          - label: Tipo
            name: tipo
            widget: select
            options: [Literal, Variante, Jogo de palavras, Contexto, Referência cruzada]
            default: Literal
          - { label: Nota, name: texto, widget: text, hint: "Até 3 frases. Termos originais em *itálico*." }
```

### 7.3 Como o acesso é restrito

- Para **salvar**, o editor precisa entrar com o GitHub e ter **permissão de escrita** no repositório. Quem não é colaborador pode abrir `/admin`, mas não entra nem grava.
- Para dar acesso a um revisor: *GitHub → Settings → Collaborators → Add people*.
- Opcional: repositório **privado** (a Cloudflare Pages faz o build normalmente).
- Opcional: proteger `/admin*` com **Cloudflare Access** (gratuito até 50 usuários).

---

## 8. Mecanismo recomendado para as notas de tradução

**Em uma frase:** as notas são uma **lista estruturada, separada do texto**, ligada ao versículo pelo número. No site, o versículo ganha um marcador discreto e, ao tocar nele, um **rolo de pergaminho** desenrola com a nota.

### 8.1 Por que assim

| Escolha | Motivo |
|---|---|
| Lista de notas **fora** do texto | O texto continua limpo para editar e revisar. Não há marcações no meio dos versículos |
| Ligação pelo **número do versículo** | Simples de preencher. Dá para adicionar ou corrigir notas depois, sem tocar no texto |
| Campo **tipo** (Literal, Variante, Jogo de palavras, Contexto, Referência cruzada) | O leitor entende a natureza de cada nota, e você mantém um padrão |
| **Várias notas por versículo** | Basta repetir o número do versículo |
| Markdown de linha (`*itálico*`) | Para termos em hebraico, aramaico e grego |
| **Validação na construção** | Uma nota apontando para um versículo que não existe **quebra o build** com uma mensagem clara e o site publicado continua o anterior |

Alternativas descartadas: marcar a nota **dentro** do versículo (ex.: `{{nota: ...}}`) polui o texto e atrapalha a edição; rodapé ou margem consomem espaço da página e atrapalham a paginação automática.

### 8.2 Fluxo de trabalho

1. **Capítulos → Novo capítulo**: escolha o livro, o número e deixe `rascunho`.
2. Cole os versículos no campo **Versículos** (um por linha).
3. Em **Notas de tradução → Adicionar nota**: informe o versículo, o tipo e o texto.
4. Quando estiver pronto, mude para `publicado` e salve.
5. Notas novas ou corrigidas depois seguem o mesmo caminho: abra o capítulo, edite a nota e salve.

**Boas práticas:**

- Comece a nota pelo termo original em itálico: `*ruach Elohim*: "sopro de Deus"...`.
- Uma ideia por nota; se precisar de outra, crie outra nota (mesmo versículo, outro tipo).
- Use **Variante** para leituras alternativas do texto ou da tradução, e **Literal** para o sentido palavra por palavra.

### 8.3 O que o leitor faz com as notas

- O marcador (círculo com "n") fica no **fim** do versículo.
- Ao tocar nele, o rolo desenrola (ao lado do livro no computador; subindo da base no celular) e toca o som de folha.
- O rolo fecha ao tocar em "Fechar", com **Esc**, ao tocar de novo no marcador ou ao virar a página.
- O botão **Notas ligadas/desligadas** (topo) esconde os marcadores para quem quer ler sem interrupção.

### 8.4 Melhoria opcional: pré-visualização com versículos numerados

O Sveltia/Decap permitem um *preview template* (painel à direita do editor). Um painel que mostre os versículos numerados ao lado das notas ajuda a conferir o número de cada nota sem contar linhas. Fica como melhoria futura, e o fluxo acima funciona sem ele.

---

## 9. Dados de cada tomo: `src/pages/dados/[slug].json.ts`

Gera `/dados/genesis.json`, `/dados/salmos.json` etc. Só entram capítulos **publicados** e só existem arquivos para livros que têm ao menos um capítulo publicado.

```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { marked } from 'marked';

const publicados = async () =>
  (await getCollection('capitulos')).filter((c) => c.data.status === 'publicado');

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = [...new Set((await publicados()).map((c) => c.data.livro))];
  return slugs.map((slug) => ({ params: { slug } }));
};

export const GET: APIRoute = async ({ params }) => {
  const caps = (await publicados())
    .filter((c) => c.data.livro === params.slug)
    .sort((a, b) => a.data.numero - b.data.numero)
    .map((c) => {
      const versos = (c.body ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => marked.parseInline(l) as string);

      const notas: Record<number, [string, string][]> = {};
      for (const n of c.data.notas) {
        if (n.versiculo > versos.length) {
          throw new Error(
            `${c.data.livro} ${c.data.numero}: há nota para o versículo ${n.versiculo}, mas o capítulo tem só ${versos.length}.`
          );
        }
        (notas[n.versiculo] ??= []).push([n.tipo, marked.parseInline(n.texto) as string]);
      }
      return [c.data.numero, versos, notas];
    });

  return new Response(JSON.stringify(caps), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

Formato de saída, por capítulo: `[numero, [versículos em HTML], { "versiculo": [["Tipo", "texto em HTML"], ...] }]`.

---

## 10. Layout, estilos e páginas

### 10.1 `src/layouts/Base.astro`

```astro
---
import '../styles/global.css';
interface Props { titulo: string; descricao?: string }
const { titulo, descricao = '' } = Astro.props;
---
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content={descricao} />
    <title>{titulo}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Meddon&display=swap" rel="stylesheet" />
    <script is:inline>
      try { var t = localStorage.getItem('tema'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) {}
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 10.2 `src/styles/global.css`

Tema claro e escuro ("luz de vela"), couro e dourado, pergaminho com textura, estantes, rolo e marcadores de nota. As imagens vêm de `public/img/`.

```css
:root {
  --room:#3a2718; --roomink:#ead9b0; --gold:#cfa95a;
  --pg:#e8d6a6; --pgedge:rgba(110,70,25,.45); --ink:#2a190c; --soft:#7b6240; --rubric:#8a2b1c;
  --ruido:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .22 0 0 0 0 .08 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);
}
html { scroll-padding-top:env(safe-area-inset-top,0px); }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --room:#140d08; --pg:#352a1c; --pgedge:rgba(0,0,0,.6); --ink:#e8d8b0; --soft:#a8946d; --rubric:#d9826a; }
}
:root[data-theme="dark"] { --room:#140d08; --pg:#352a1c; --pgedge:rgba(0,0,0,.6); --ink:#e8d8b0; --soft:#a8946d; --rubric:#d9826a; }
* { box-sizing:border-box; }
body { margin:0; background-color:var(--room); background-image:radial-gradient(ellipse at 50% 0%, rgba(255,190,100,.14), transparent 65%); color:var(--roomink); font-family:'Meddon',Georgia,serif; font-size:17px; line-height:1.75; min-height:100vh; }
h1,h2,h3 { font-family:'Cinzel',Georgia,serif; font-weight:400; line-height:1.2; margin:0; }
a { color:var(--gold); }
button { font:inherit; color:var(--roomink); background:transparent; border:1px solid rgba(207,169,90,.55); border-radius:4px; padding:6px 14px; cursor:pointer; }
button:hover { background:rgba(207,169,90,.14); }
:is(button,a):focus-visible { outline:2px solid var(--gold); outline-offset:3px; }
.btn { display:inline-block; background:var(--gold); color:#2a190c; border:0; border-radius:4px; padding:12px 30px; text-decoration:none; font-size:1.05rem; }
.wrap { max-width:760px; margin:0 auto; padding:0 24px; }
.topo { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:10px 16px; background:rgba(0,0,0,.28); border-bottom:1px solid rgba(207,169,90,.3); }
.topo > a { font-family:'Cinzel',Georgia,serif; text-decoration:none; }
.topo > div { display:flex; gap:8px; flex-wrap:wrap; }
.topo select { font:inherit; color:var(--roomink); background:#24160d; border:1px solid rgba(207,169,90,.55); border-radius:4px; padding:6px 10px; max-width:46vw; }

/* capa de grimório */
.grimorio { position:relative; aspect-ratio:1/1.45; container-type:inline-size; border-radius:3px 7px 7px 3px; background:var(--capa) center/cover no-repeat; box-shadow:inset 10px 0 14px -10px rgba(0,0,0,.8), 0 22px 44px -14px rgba(0,0,0,.75); }
.grimorio.contra { background-image:var(--contra); }
.placa { position:absolute; left:50%; bottom:4.4%; transform:translateX(-50%); padding:.3em 1.1em; font-family:'Cinzel',Georgia,serif; font-size:calc(4.6cqw * var(--k, 1)); letter-spacing:.09em; text-transform:uppercase; white-space:nowrap; color:#e6c984; background:rgba(18,9,4,.82); border:1px solid rgba(207,169,90,.7); text-shadow:0 1px 2px #000; }

/* landing */
.hero { text-align:center; padding:44px 0 28px; }
.hero .grimorio { width:min(310px,74vw); margin:0 auto 32px; }
.hero p.lede { max-width:46ch; margin:0 auto 24px; }
.bloco { border-top:1px solid rgba(207,169,90,.28); padding:28px 0; text-align:center; }
.bloco h2 { font-size:1.25rem; margin-bottom:10px; }
.barra { height:8px; background:rgba(0,0,0,.4); border-radius:99px; overflow:hidden; margin:10px auto 0; max-width:420px; border:1px solid rgba(207,169,90,.4); }
.barra span { display:block; height:100%; background:var(--gold); }
.aviso { color:rgba(234,217,176,.7); font-size:.9rem; max-width:56ch; margin:8px auto 0; }

/* biblioteca */
.intro { text-align:center; padding:28px 0 8px; }
.intro p { margin:6px auto 0; max-width:52ch; color:rgba(234,217,176,.8); }
#estante h2 { font-size:1.1rem; margin:22px 0 14px; text-align:center; }
.prateleira { display:flex; align-items:flex-end; gap:3px; padding:0 10px; border-bottom:14px solid #2a190d; background:linear-gradient(transparent 70%, rgba(0,0,0,.3)); box-shadow:0 10px 14px -8px rgba(0,0,0,.7); margin-bottom:26px; }
.lombo { position:relative; flex:1 1 0; min-width:0; max-width:58px; height:calc(172px + var(--h) * 1px); display:flex; align-items:center; justify-content:center; writing-mode:vertical-rl; padding:26px 0; font-family:'Cinzel',Georgia,serif; font-size:.7rem; color:var(--gold); text-decoration:none; white-space:nowrap; overflow:hidden; border-radius:2px 2px 0 0;
  background:linear-gradient(90deg, rgba(0,0,0,.4), transparent 28%, transparent 68%, rgba(0,0,0,.45)), var(--ruido), var(--c); filter:brightness(.55) saturate(.6); cursor:default; }
.lombo::before, .lombo::after { content:""; position:absolute; left:0; right:0; height:6px; border-block:1px solid rgba(207,169,90,.7); }
.lombo::before { top:10px; } .lombo::after { bottom:10px; }
.lombo.ok { filter:none; cursor:pointer; box-shadow:0 0 12px rgba(207,169,90,.25); transition:transform .15s; }
.lombo.ok:hover, .lombo.ok:focus-visible { transform:translateY(-10px); }

/* leitor */
.sala { animation:abrir .5s ease-out; }
@keyframes abrir { from { transform:scale(.93); opacity:0; } }
@media (prefers-reduced-motion: reduce) { .sala { animation:none; } }
#livro-wrap { display:flex; justify-content:center; padding:22px 0 8px; min-height:60vh; overflow:hidden; }
.ctrl { display:flex; gap:16px; justify-content:center; align-items:center; padding:8px 0 24px; color:rgba(234,217,176,.75); }
.page { background:radial-gradient(ellipse at 50% 45%, transparent 50%, var(--pgedge) 100%), var(--ruido), var(--pg); color:var(--ink); }
.page.duro { background:none; }
.page.duro .grimorio { height:100%; aspect-ratio:auto; border-radius:0; box-shadow:none; }
.page-content { height:100%; overflow:hidden; padding:34px 30px 46px; font-size:16px; line-height:1.72; text-align:left; hyphens:auto; }
.page-content h2 { font-size:1.3em; text-align:center; margin:0 0 2px; color:var(--rubric); }
.page-content h3 { font-family:'Meddon',Georgia,serif; font-style:italic; font-size:1em; text-align:center; color:var(--soft); margin:0 0 20px; }
.page-content p { margin:0 0 .55em; }
.page-content sup { font-size:.62em; color:var(--rubric); margin-right:2px; }
.ini::first-letter { font-family:'Meddon',Georgia,serif; float:left; font-size:3.4em; line-height:.8; padding:6px 8px 0 0; color:var(--rubric); }
.num { position:absolute; bottom:16px; left:0; right:0; text-align:center; font-size:13px; color:var(--soft); font-style:italic; }
.fim { height:100%; display:flex; align-items:center; justify-content:center; text-align:center; padding:30px; color:var(--soft); font-style:italic; }
:root { --capa:url("/img/capa.jpg"); --contra:url("/img/contracapa.jpg"); }
button, .btn, .topo select { font-family:'Cinzel',Georgia,serif; letter-spacing:.04em; font-size:.82rem; }
.btn { font-size:.95rem; }
.page-content h2 { font-family:'Meddon',Georgia,serif; font-size:1.55em; }
.lombo { font-size:.62rem; padding:22px 0; height:calc(190px + var(--h) * 1px); }
.ctrl { flex-wrap:wrap; }
#continuar { font-size:.74rem; }
.nota { display:inline-grid; place-items:center; width:1.25em; height:1.25em; margin-left:.35em; padding:0; vertical-align:.08em; border:1px solid var(--rubric); border-radius:50%; background:transparent; color:var(--rubric); font:600 .6em 'Cinzel',Georgia,serif; letter-spacing:0; cursor:pointer; }
.nota:hover, .nota.ativa { background:var(--rubric); color:var(--pg); }
.sem-notas .nota { visibility:hidden; pointer-events:none; }
.rolo { position:fixed; z-index:20; right:16px; top:calc(92px + env(safe-area-inset-top,0px)); width:min(330px, calc(100vw - 24px)); max-height:min(70vh,560px); display:grid; grid-template-rows:auto 0fr auto; visibility:hidden; opacity:0; outline:none; filter:drop-shadow(0 18px 22px rgba(0,0,0,.6)); transition:grid-template-rows .65s cubic-bezier(.3,.75,.25,1), opacity .25s, visibility 0s .65s; }
.rolo.aberto { grid-template-rows:auto 1fr auto; visibility:visible; opacity:1; transition-delay:0s; }
.haste { position:relative; height:16px; margin:0 -6px; border-radius:8px; background:linear-gradient(#8a5a33,#4a2a14 55%,#8a5a33); box-shadow:inset 0 1px 0 rgba(255,220,160,.35); }
.haste::before, .haste::after { content:""; position:absolute; top:-3px; width:12px; height:22px; border-radius:5px; background:linear-gradient(90deg,#b98a4a,#5b3719); }
.haste::before { left:-4px; } .haste::after { right:-4px; }
.papel { min-height:0; overflow:auto; scrollbar-width:thin; margin:0 4px; background:radial-gradient(ellipse at 50% 45%, transparent 50%, var(--pgedge) 100%), var(--ruido), var(--pg); color:var(--ink); }
.conteudo { padding:14px 18px 18px; }
.rolo-topo { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--soft); }
.rolo-topo h3 { font-family:'Meddon',Georgia,serif; font-size:1.15rem; color:var(--rubric); }
.rolo-topo button { color:var(--ink); border-color:var(--soft); padding:3px 10px; font-size:.7rem; }
.rolo p { margin:0 0 .7em; font-size:.95rem; line-height:1.65; }
.tipo { display:inline-block; margin-right:.5em; font-family:'Cinzel',Georgia,serif; font-size:.66rem; letter-spacing:.08em; text-transform:uppercase; color:var(--rubric); }
@media (max-width:720px) { .rolo { top:auto; left:12px; right:12px; width:auto; bottom:calc(10px + env(safe-area-inset-bottom,0px)); max-height:55vh; } }
@media (prefers-reduced-motion: reduce) { .rolo { transition:none; } }
```

### 10.3 Landing page: `src/pages/index.astro`

```astro
---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';
import livros from '../data/livros.json';

const publicados = (await getCollection('capitulos')).filter((c) => c.data.status === 'publicado');
const tomos = new Set(publicados.map((c) => c.data.livro)).size;
const pct = Math.max(3, Math.round((tomos / livros.length) * 100));
---
<Base titulo="Nossa Bíblia Livre" descricao="Tradução livre da Bíblia, tomo por tomo.">
  <main>
    <div class="wrap">
      <header class="hero">
        <div class="grimorio" role="img" aria-label="Capa: Nossa Bíblia Livre"></div>
        <p class="lede">
          Uma tradução livre da Bíblia, feita tomo por tomo e capítulo por capítulo. Cada livro é um
          volume na estante. Os que já estão prontos podem ser abertos e lidos.
        </p>
        <a class="btn" href="/ler">Entrar na biblioteca</a>
      </header>

      <section class="bloco">
        <h2>Andamento</h2>
        <p>{tomos} de {livros.length} tomos com capítulos publicados.</p>
        <div class="barra"><span style={`width:${pct}%`}></span></div>
      </section>

      <section class="bloco">
        <h2>Sobre o projeto</h2>
        <p>
          Um projeto independente e em andamento. Cada capítulo é revisado e publicado assim que fica
          pronto, e pode ser corrigido depois. As notas de tradução explicam as escolhas feitas.
        </p>
        <p class="aviso">Tradução livre, de caráter pessoal. Não substitui as edições oficiais.</p>
      </section>
    </div>
  </main>
</Base>
```

### 10.4 Biblioteca e leitor: `src/pages/ler.astro`

Uma única página com duas "vistas", trocadas pelo endereço (`#/` = biblioteca, `#/tomo/genesis` = leitor):

```astro
---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';
import livros from '../data/livros.json';

const publicados = new Set(
  (await getCollection('capitulos')).filter((c) => c.data.status === 'publicado').map((c) => c.data.livro)
);
const lista = livros.map((l) => ({ ...l, ok: publicados.has(l.slug) }));
const dados = JSON.stringify(lista).replace(/</g, '\\u003c');
---
<Base titulo="Biblioteca · Nossa Bíblia Livre">
  <!-- Vista 1: biblioteca (estantes com os tomos) -->
  <main id="lib">
    <div class="topo">
      <a href="/">Nossa Bíblia Livre</a>
      <div><button class="som" type="button"></button><button class="tema" type="button">Tema</button></div>
    </div>
    <div class="wrap sala">
      <div class="intro">
        <h1>Biblioteca</h1>
        <p>Os tomos com brilho dourado já podem ser abertos. Os demais aguardam tradução.</p>
      </div>
      <div id="estante"></div>
    </div>
  </main>

  <!-- Vista 2: leitor do tomo -->
  <main id="leitor" hidden>
    <div class="topo">
      <a href="#/">Biblioteca</a>
      <div>
        <select id="indice" aria-label="Ir para o capítulo"></select>
        <button id="btnnotas" type="button" aria-pressed="true"></button>
        <button class="som" type="button"></button>
        <button class="tema" type="button">Tema</button>
      </div>
    </div>
    <div id="livro-wrap" class="sala"></div>
    <div class="ctrl">
      <button id="continuar" type="button" hidden></button>
      <button id="ant" type="button">Anterior</button>
      <span id="pos"></span>
      <button id="prox" type="button">Próxima</button>
    </div>
    <aside id="rolo" class="rolo" role="dialog" aria-label="Nota de tradução" aria-hidden="true" tabindex="-1">
      <div class="haste"></div>
      <div class="papel"><div class="conteudo">
        <div class="rolo-topo"><h3 id="rolo-tit"></h3><button id="rolo-x" type="button" aria-label="Fechar nota">Fechar</button></div>
        <div id="rolo-txt"></div>
      </div></div>
      <div class="haste"></div>
    </aside>
  </main>

  <script type="application/json" id="dados" set:html={dados}></script>

  <script>
import { PageFlip } from 'page-flip';

const $ = (id) => document.getElementById(id);
const salvar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

/* ---------- dados: lista dos livros embutida; texto de cada tomo sob demanda ---------- */
const LIVROS = JSON.parse($('dados').textContent);   // [{ n, t, slug, ok }]
const cacheTomos = {};
async function carregarTomo(slug) {
  if (!cacheTomos[slug]) cacheTomos[slug] = await (await fetch(`/dados/${slug}.json`)).json();
  return cacheTomos[slug];                              // [[cap, [versículos], { v: [[tipo, texto]] }], ...]
}

/* ---------- som ---------- */
const AUDIO = { tomo: '/audio/tomo.mp3', folhas: '/audio/folhas.mp3' };
let ctx = null, somOn = ler('som') !== 'off', amostras = {};
function iniciarAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    for (const k in AUDIO) fetch(AUDIO[k]).then(r => r.arrayBuffer()).then(buf => ctx.decodeAudioData(buf)).then(b => { amostras[k] = b; }).catch(() => {});
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function tocar(nome, { vol = 1, taxa = 1, atraso = 0 } = {}) {
  if (!ctx || !somOn || !amostras[nome]) return;
  const s = ctx.createBufferSource(); s.buffer = amostras[nome]; s.playbackRate.value = taxa;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(g); g.connect(ctx.destination); s.start(ctx.currentTime + atraso);
}
const somFolha = () => tocar('folhas', { vol: .6 + Math.random() * .25, taxa: .93 + Math.random() * .16 });
const somAbrir = () => { tocar('tomo', { vol: .9 }); tocar('folhas', { vol: .3, taxa: 1.12, atraso: .12 }); };
const somFechar = () => tocar('tomo', { vol: .9, taxa: .82 });
function rotuloSom() { document.querySelectorAll('.som').forEach(b => b.textContent = somOn ? 'Som ligado' : 'Som desligado'); }
document.querySelectorAll('.som').forEach(b => b.onclick = () => { iniciarAudio(); somOn = !somOn; salvar('som', somOn ? 'on' : 'off'); rotuloSom(); });
iniciarAudio();
window.addEventListener('pointerdown', iniciarAudio);

/* ---------- capa do tomo ---------- */
const capaHTML = (nome, extra = '') => {
  const k = nome ? Math.min(1, 11 / nome.length) : 1;
  const rot = extra ? 'Contracapa' : 'Capa: ' + (nome || 'Nossa Bíblia Livre');
  return `<div class="grimorio ${extra}" style="--k:${k}" role="img" aria-label="${rot}">${nome ? `<span class="placa">${nome}</span>` : ''}</div>`;
};

/* ---------- biblioteca ---------- */
function montarBiblioteca() {
  const cores = ['#5a2a1c', '#34264a', '#1f3b34', '#4a1f26', '#2c3a52', '#4d3a1c'];
  const secao = (t, titulo) => {
    const lista = LIVROS.map((l, i) => ({ ...l, i })).filter(l => l.t === t);
    let h = `<h2>${titulo}</h2>`;
    for (let k = 0; k < lista.length; k += 14) {
      h += '<div class="prateleira">' + lista.slice(k, k + 14).map(l => {
        const est = `--c:${cores[l.i % 6]};--h:${(l.i * 37) % 22}`;
        return l.ok
          ? `<a class="lombo ok" href="#/tomo/${l.slug}" style="${est}" title="Abrir ${l.n}">${l.n}</a>`
          : `<span class="lombo" style="${est}" title="${l.n}: em tradução">${l.n}</span>`;
      }).join('') + '</div>';
    }
    return h;
  };
  $('estante').innerHTML = secao('AT', 'Antigo Testamento') + secao('NT', 'Novo Testamento');
}

/* ---------- leitor ---------- */
let flip = null, atual = { i: null, cap: null }, cur = 0, vistaAnt = null, capsAtual = [];

function paginar(html, w, h) {
  const origem = document.createElement('div');
  origem.innerHTML = html;
  const sonda = document.createElement('div');
  sonda.className = 'page-content';
  sonda.style.cssText = `position:absolute;left:-9999px;top:0;width:${w}px;height:${h}px;`;
  document.body.appendChild(sonda);
  const paginas = []; let corrente = [];
  for (const bloco of Array.from(origem.children)) {
    sonda.appendChild(bloco.cloneNode(true));
    if (sonda.scrollHeight > sonda.clientHeight && corrente.length) {
      paginas.push(corrente.map(b => b.outerHTML).join(''));
      sonda.innerHTML = '';
      sonda.appendChild(bloco.cloneNode(true));
      corrente = [];
    }
    corrente.push(bloco);
  }
  if (corrente.length) paginas.push(corrente.map(b => b.outerHTML).join(''));
  sonda.remove();
  return paginas;
}

function elPagina(html, num, duro) {
  const d = document.createElement('div');
  d.className = 'page' + (duro ? ' duro' : '');
  if (duro) d.setAttribute('data-density', 'hard');
  d.innerHTML = duro ? html : `<div class="page-content">${html}</div>${num ? `<span class="num">${num}</span>` : ''}`;
  return d;
}

const versiculos = (vs, notas = {}, cap = 0) => vs.map((t, k) => {
  const n = k + 1;
  const m = notas[n] ? ` <button class="nota" type="button" data-c="${cap}" data-v="${n}" aria-label="Nota de tradução, versículo ${n}">n</button>` : '';
  return k === 0 ? `<p class="ini">${t}${m}</p>` : `<p><sup>${n}</sup>${t}${m}</p>`;
}).join('');

async function montarLeitor(i, capAlvo, manter) {
  atual = { i, cap: capAlvo }; notaAtiva = null; rolo.classList.remove('aberto');
  const nome = LIVROS[i].n, caps = await carregarTomo(LIVROS[i].slug);
  capsAtual = caps;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const maxW = Math.min(440, window.innerWidth - 24);
  const H = Math.max(380, Math.min(Math.round(maxW * 1.45), window.innerHeight - 150));
  const W = Math.min(maxW, Math.round(H / 1.45));

  const paginas = [elPagina(capaHTML(nome), 0, true)];
  const dono = [0], inicio = {};
  for (const [cap, vs, notas] of caps) {
    inicio[cap] = paginas.length;
    for (const p of paginar(`<h2>Capítulo ${cap}</h2><h3>${nome}</h3>${versiculos(vs, notas, cap)}`, W, H)) {
      dono.push(cap);
      paginas.push(elPagina(p, paginas.length, false));
    }
  }
  if (paginas.length % 2 === 0) { paginas.push(elPagina('', 0, false)); dono.push(-2); } // folha em branco: o livro fecha como abriu
  paginas.push(elPagina(capaHTML('', 'contra'), 0, true));
  dono.push(-1);

  $('indice').innerHTML = caps.map(([c]) => `<option value="${c}">${nome} ${c}</option>`).join('');

  if (flip) { try { flip.destroy(); } catch (e) {} flip = null; }
  $('livro-wrap').innerHTML = '<div id="livro"></div>';
  flip = new PageFlip($('livro'), { width: W, height: H, size: 'fixed', showCover: true, usePortrait: true, maxShadowOpacity: 0.4, mobileScrollSupport: false });
  flip.loadFromHTML(paginas);
  flip.on('changeState', (e) => { if (e.data === 'flipping') { fecharRolo(false); (cur === 0 ? somAbrir() : somFolha()); } });

  const chave = 'prog:' + nome;
  const atualizar = (p) => {
    cur = p;
    $('pos').textContent = `${p + 1} de ${paginas.length}`;
    const cap = dono[p];
    if (cap > 0) { $('indice').value = String(cap); salvar(chave, JSON.stringify({ cap, pag: p - inicio[cap] })); }
  };
  flip.on('flip', (e) => { if ((e.data === 0 || e.data === paginas.length - 1) && e.data !== cur) somFechar(); atualizar(e.data); });

  let alvo = 0, salvo = null;
  try { const s = JSON.parse(ler(chave)); if (s && inicio[s.cap] !== undefined) salvo = { cap: s.cap, pag: Math.min(inicio[s.cap] + s.pag, paginas.length - 2) }; } catch (e) {}
  if (capAlvo && inicio[capAlvo] !== undefined) alvo = inicio[capAlvo];
  else if (manter && salvo) alvo = salvo.pag;
  if (alvo > 0) flip.turnToPage(alvo);
  atualizar(alvo);
  const bc = $('continuar');
  bc.hidden = !(salvo && alvo === 0);
  if (salvo) { bc.textContent = `Continuar de ${nome} ${salvo.cap}`; bc.onclick = () => { somFolha(); flip.turnToPage(salvo.pag); atualizar(salvo.pag); bc.hidden = true; }; }

  $('indice').onchange = () => { somFolha(); flip.turnToPage(inicio[Number($('indice').value)]); };
  $('ant').onclick = () => flip.flipPrev();
  $('prox').onclick = () => flip.flipNext();
}

/* ---------- rolo de notas de tradução ---------- */
const rolo = $('rolo'); let notaAtiva = null;
function fecharRolo(som) {
  if (!rolo.classList.contains('aberto')) return;
  rolo.classList.remove('aberto'); rolo.setAttribute('aria-hidden', 'true');
  if (notaAtiva) { notaAtiva.classList.remove('ativa'); try { notaAtiva.focus({ preventScroll: true }); } catch (e) {} notaAtiva = null; }
  if (som) tocar('folhas', { vol: .25, taxa: 1.5 });
}
function abrirRolo(btn) {
  if (notaAtiva === btn) { fecharRolo(true); return; }
  const c = Number(btn.dataset.c), v = Number(btn.dataset.v), nome = LIVROS[atual.i].n;
  const cap = capsAtual.find(x => x[0] === c), notas = (cap && cap[2] && cap[2][v]) || [];
  if (notaAtiva) notaAtiva.classList.remove('ativa');
  notaAtiva = btn; btn.classList.add('ativa');
  $('rolo-tit').textContent = `${nome} ${c}:${v}`;
  $('rolo-txt').innerHTML = notas.map(([tipo, txt]) => `<p><span class="tipo">${tipo}</span>${txt}</p>`).join('');
  if (!rolo.classList.contains('aberto')) tocar('folhas', { vol: .4, taxa: 1.3 });
  rolo.classList.add('aberto'); rolo.setAttribute('aria-hidden', 'false');
}
$('livro-wrap').addEventListener('click', (e) => { const b = e.target.closest('.nota'); if (b) abrirRolo(b); });
$('rolo-x').onclick = () => fecharRolo(true);
let notasOn = ler('notas') !== 'off';
function rotuloNotas() {
  const b = $('btnnotas');
  b.textContent = notasOn ? 'Notas ligadas' : 'Notas desligadas';
  b.setAttribute('aria-pressed', String(notasOn));
  $('livro-wrap').classList.toggle('sem-notas', !notasOn);
}
$('btnnotas').onclick = () => { notasOn = !notasOn; salvar('notas', notasOn ? 'on' : 'off'); if (!notasOn) fecharRolo(false); rotuloNotas(); };

/* ---------- rotas, tema, teclado ---------- */
function rota() {
  fecharRolo(false);
  const m = location.hash.match(/^#\/tomo\/([a-z0-9-]+)(?:\/(\d+))?$/);
  const i = m ? LIVROS.findIndex(l => l.slug === m[1] && l.ok) : -1;
  const vista = i >= 0 ? 'leitor' : 'lib';
  ['lib', 'leitor'].forEach(v => $(v).hidden = v !== vista);
  window.scrollTo(0, 0);
  if (vistaAnt === 'leitor' && vista !== 'leitor') somFechar();
  vistaAnt = vista;
  if (i >= 0) { somAbrir(); montarLeitor(i, m[2] ? Number(m[2]) : null); }
}
window.addEventListener('hashchange', rota);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharRolo(true);
  if (!flip || $('leitor').hidden) return;
  if (e.key === 'ArrowLeft') flip.flipPrev();
  if (e.key === 'ArrowRight') flip.flipNext();
});
document.querySelectorAll('.tema').forEach(b => b.onclick = () => {
  const r = document.documentElement;
  const cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const novo = cur === 'dark' ? 'light' : 'dark';
  r.setAttribute('data-theme', novo);
  salvar('tema', novo);
});
let larg = window.innerWidth, tmr;
window.addEventListener('resize', () => {
  clearTimeout(tmr);
  tmr = setTimeout(() => {
    if (window.innerWidth !== larg) { larg = window.innerWidth; if (!$('leitor').hidden) montarLeitor(atual.i, null, true); }
  }, 300);
});

rotuloSom(); rotuloNotas(); montarBiblioteca(); rota();
  </script>
</Base>
```

---

## 11. Como o leitor se comporta

- **Abre sempre na capa.** Se a pessoa já leu parte do tomo, aparece um botão **"Continuar de Gênesis 2"**. Links como `/ler#/tomo/genesis/2` abrem direto no capítulo.
- **Folha em branco.** Se o tomo termina com número ímpar de páginas, o leitor insere uma folha de pergaminho vazia antes da contracapa. Assim a contracapa fica sozinha, e o livro **fecha como abriu**.
- **Sons.** Abrir o tomo e a capa: `tomo.mp3` (com um farfalhar suave). Fechar (voltar à biblioteca ou fechar a capa): `tomo.mp3` mais grave. Virar página: `folhas.mp3` com velocidade e volume ligeiramente diferentes a cada vez, para não soar repetido.
- **Paginação automática.** O capítulo é dividido em páginas medindo o texto no navegador e refeito ao girar a tela ou redimensionar a janela, mantendo a página atual.
- **Progresso.** O capítulo e a página ficam no `localStorage` (por navegador). Também lembra o tema, o som e as notas ligadas/desligadas.

**Limitações conhecidas:**

- Um **único versículo maior que uma página** fica cortado (improvável na Bíblia; se acontecer, divida a linha em dois versículos só no texto exibido ou me peça a quebra por frases).
- O leitor depende de JavaScript.
- O tema claro ("pergaminho") e o escuro ("luz de vela") mudam as páginas, e a sala e as capas continuam em tons de couro.

---

## 12. Rodando localmente

```bash
npm run dev
```

- Site: `http://localhost:4321` (landing) e `http://localhost:4321/ler` (biblioteca)
- Editor: `http://localhost:4321/admin/`. Na tela de login do Sveltia, no Chrome/Edge, escolha **"Work with Local Repository"** e selecione a pasta do projeto

Crie ao menos um capítulo (`status: publicado`) para o tomo acender na estante. Para conferir o build final (inclusive a validação das notas):

```bash
npm run build
npm run preview
```

---

## 13. Publicando (GitHub + Cloudflare Pages)

1. Suba o projeto para o GitHub e ajuste `repo:` em `public/admin/config.yml`.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build: **Framework preset** Astro · **Build command** `npm run build` · **Output** `dist`.
4. Login do editor em produção, duas opções:
   - **Token pessoal** (mais simples): o Sveltia permite entrar com um *Personal Access Token* do GitHub (fine-grained, só neste repositório, permissão *Contents: Read and write*).
   - **Botão "Entrar com GitHub" (OAuth):** use o projeto **sveltia-cms-auth** (Worker da Cloudflare que faz a ponte), crie um *OAuth App* no GitHub e informe `base_url` em `config.yml`.

> Se preferir o **Decap CMS**, o `config.yml` serve quase igual: troque o `<script>` em `admin/index.html` pelo do Decap.

---

## 14. Rotina de trabalho

1. Abra `/admin` e entre.
2. **Capítulos → Novo capítulo**, escolha o livro e o número, cole os versículos.
3. Adicione as **notas de tradução** (versículo, tipo, texto).
4. Mude o status para `publicado` e salve.
5. Em ≈1 minuto o capítulo (e o tomo, se for o primeiro) aparece no site, e a barra de andamento da landing page é atualizada sozinha.
6. Se o build falhar por causa de uma nota (versículo inexistente), a mensagem do build diz livro, capítulo e versículo. Corrija e salve de novo; o site anterior continua no ar.

---

## 15. Ideias para depois

- Pré-visualização com versículos numerados no editor (seção 8.4)
- Notas do capítulo inteiro (ex.: `versiculo: 0`) e glossário de termos originais reutilizável
- Busca por palavra ou versículo
- Divisão de versículos muito longos por frases
- Ajuste de tamanho da fonte pelo leitor
- Fluxo editorial (revisão por outra pessoa) com `editorial_workflow` do CMS
- Imagem de compartilhamento (Open Graph) com a capa

---

## 16. Direitos autorais e fontes do texto

"Tradução livre" não dispensa cuidado com a **base** usada: muitas traduções modernas da Bíblia são protegidas por direitos autorais, e adaptar de perto o texto delas pode ser considerado cópia. O mais seguro é traduzir a partir dos **textos originais** (hebraico, aramaico e grego) ou de edições em **domínio público**, e conferir a licença de cada edição que usar como apoio. Mantenha o aviso de créditos na landing page e registre as fontes consultadas.
