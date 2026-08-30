# pdfFlipbook — OMP plugin

[![OMP](https://img.shields.io/badge/OMP-3.5-brightgreen)](https://pkp.sfu.ca/omp/)
[![Version](https://img.shields.io/badge/version-0.3.0.0-blue)](version.xml)
[![License](https://img.shields.io/badge/license-GPL--3.0-lightgrey)](LICENSE)

**⬇️ Install package:** [OMP 3.5](https://github.com/OJSBR/pdfFlipbookOmp/releases/download/0.3.0.0-omp3.5/pdfFlipbook-0.3.0.0-omp3.5.tar.gz) — or browse all [Releases](../../releases).

A **page-turning** reading mode for PDF monographs, sitting **beside** the native PDF
viewer instead of replacing it: the reader gets a *Flip through* button on the book page
and a full-viewport flipbook, and can go back to the ordinary PDF at any time.

> **Developed and maintained by [OJSBR](https://ojsbr.com.br).** See the
> [Credits & authorship](#credits--authorship) section below.

## Compatibility & branches

| Application | Version | Branch | Plugin release |
|-------------|---------|--------|----------------|
| OMP | 3.5.x | [`stable-3_5_0`](../../tree/stable-3_5_0) *(default)* | 0.3.0.0 |

## What it does

- Adds a **Flip through** button next to every PDF on the book page.
- Opens a **full-viewport reader** with a two-page spread, page-turn animation, drag and
  keyboard navigation.
- **Zoom** from 50% to 250%, **full screen**, and a link back to the ordinary PDF view.
- Re-lays the book out on window resize and orientation change.

**It never replaces the native viewer.** The flipbook paints pages to `canvas`: there is
no text selection, no search and no screen-reader access. That is exactly why it is an
alternative and never the default — the PDF viewer remains the primary click.

## Installation

Upload the package in **Settings → Website → Plugins → Upload A New Plugin**, or clone
the branch into `plugins/generic/pdfFlipbook`. Then enable it in the plugin list.

## Configuration

None. The plugin has no settings: it adds a button and answers one extra parameter.

## How it works (technical)

**Coexistence.** The same reader URL serves both modes; the `leitor=folhear` parameter
decides. The plugin registers on `CatalogBookHandler::view` at **normal** sequence — that
is, *before* `pdfJsViewer`, which registers late — and returns `true` only when it really
takes over. Without the parameter it does nothing and the native viewer runs untouched.
No core patching, and the PKP plugin stays enabled.

**Rendering.** StPageFlip does not read PDF. PDF.js rasterises each page to a canvas and
StPageFlip mounts those as sheets. Both libraries are **vendored** — no CDN.

**Memory.** Pages are drawn on demand (current spread ± 2) and the canvas cache is capped
at 14 sheets; evicted pages release their bitmap. Empty `div`s are cheap, rasterised
pages are not — that is where the ceiling had to be. Above 1000 pages the reader declines
and points at the PDF viewer.

**Two behaviours of StPageFlip worth knowing**, both learned the hard way:

- `destroy()` removes the **container itself** from the DOM, not just its content. Zoom,
  resize and full screen all remount the book (the library takes width/height only in the
  constructor), so the container is recreated on every mount. Without that the reader
  mounted into an orphan node and the screen went blank **with no console error**.
- It **moves** the page elements into its own structure rather than cloning them. The
  plugin does not rely on that: it looks the sheet up from the book root, falls back to
  the whole document, and warns once — so a future version that starts cloning degrades
  with a message instead of silently drawing nothing.

## Tests

PHPUnit, in the PKP `ApplicationPlugins` suite:

```bash
cd lib/pkp/tests
php ../lib/vendor/bin/phpunit --no-coverage -c phpunit.xml \
  /absolute/path/to/plugins/generic/pdfFlipbook/tests
```

6 tests / 638 assertions covering the dispatch rule (`assumeArquivo`) — only PDF, only
with the parameter present, never EPUB, audio or an empty type — and locale integrity:
every locale carrying every key with no empty value, no legacy locale codes, and every
key used in a template present in `locale/en`, since in 3.5 a missing key renders as
`##key##` instead of falling back to English.

Cypress specs are not included yet; page turning, zoom and resize were verified by hand
in a browser against a real installation.

## Credits & authorship

- **OJSBR** — https://ojsbr.com.br — plugin design, implementation and maintenance.
- **[StPageFlip](https://github.com/Nodlik/StPageFlip)** by **Nodlik** — MIT — the
  page-turn engine.
- **[PDF.js](https://github.com/mozilla/pdf.js)** by **Mozilla** — Apache 2.0 — PDF
  rasterisation.
- **Public Knowledge Project (PKP)** — Open Monograph Press and the plugin API.

## Contributing

Issues and pull requests are welcome — see `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
Target the branch matching your OMP version.

## License

GNU GPL v3 — see [`LICENSE`](LICENSE) and [`docs/COPYING`](docs/COPYING). Vendored
libraries keep their own licences (MIT for StPageFlip, Apache 2.0 for PDF.js).

---

## 🇧🇷 Português

Modo de leitura **folheável** para PDF de livros, que fica **ao lado** do visualizador
nativo em vez de substituí-lo: o leitor ganha um botão *Folhear* na página do livro e um
flipbook em tela cheia, e pode voltar ao PDF comum a qualquer momento.

### Compatibilidade e branches

| Aplicação | Versão | Branch | Release do plugin |
|-----------|--------|--------|-------------------|
| OMP | 3.5.x | [`stable-3_5_0`](../../tree/stable-3_5_0) *(padrão)* | 0.3.0.0 |

### O que faz

- Botão **Folhear** ao lado de cada PDF na página do livro.
- **Leitor em tela cheia** com dupla de páginas, animação de virada, arrasto e teclado.
- **Zoom** de 50% a 250%, **tela cheia** e link de volta para o PDF comum.
- Recalcula o tamanho das folhas ao redimensionar a janela ou girar o aparelho.

**Ele nunca substitui o visualizador nativo.** O flipbook desenha as páginas em `canvas`:
não há seleção de texto, busca nem leitura por leitor de tela. É por isso que ele é
alternativa e nunca o padrão — o PDF continua sendo o clique principal.

### Instalação

Envie o pacote em **Configurações → Website → Plugins → Enviar um novo plugin**, ou clone
a branch em `plugins/generic/pdfFlipbook`. Depois ative na lista de plugins.

### Configuração

Nenhuma. O plugin não tem configurações: acrescenta um botão e responde a um parâmetro.

### Como funciona (técnico)

**Convivência.** O mesmo endereço serve os dois modos; quem decide é o parâmetro
`leitor=folhear`. O plugin se registra no hook `CatalogBookHandler::view` em sequência
**normal** — antes do `pdfJsViewer`, que é tardio — e só devolve `true` quando realmente
assume. Sem o parâmetro, não faz nada e o visualizador nativo segue intacto. Sem patch no
núcleo e sem desligar o plugin do PKP.

**Renderização.** O StPageFlip não lê PDF: o PDF.js rasteriza cada página em canvas e o
StPageFlip monta as folhas. As duas bibliotecas são **vendorizadas**, sem CDN.

**Memória.** As páginas são desenhadas sob demanda (a dupla atual ± 2) e o cache de canvas
tem teto de 14 folhas, liberando o bitmap das descartadas. `div` vazia é barata; página
rasterizada não é — o teto real tinha de ser aí. Acima de 1000 páginas o leitor recusa e
aponta o visualizador de PDF.

**Dois comportamentos do StPageFlip que valem saber**, os dois aprendidos na marra:

- O `destroy()` remove o **próprio contêiner** do DOM, não só o conteúdo. Zoom,
  redimensionamento e tela cheia remontam o livro (a biblioteca só aceita largura/altura
  no construtor), então o contêiner é recriado a cada montagem. Sem isso, o leitor montava
  num nó órfão e a tela ficava vazia **sem um erro no console**.
- Ele **move** as folhas para a estrutura dele em vez de cloná-las. O plugin não depende
  disso: procura a folha a partir da raiz do livro, cai para o documento inteiro e avisa
  uma vez — assim, uma versão futura que passe a clonar degrada com recado em vez de
  desenhar nada em silêncio.

### Testes

PHPUnit, na suíte `ApplicationPlugins` do PKP — 6 testes e 638 asserções cobrindo a regra
de despacho (`assumeArquivo`): só PDF, só com o parâmetro presente, nunca EPUB, áudio ou
tipo vazio; e a integridade dos locales — todos com todas as chaves, sem valor vazio, sem
códigos legados, e toda chave usada em template presente no `locale/en`, já que no 3.5
chave faltante vira `##chave##` em vez de cair no inglês.

Ainda não há specs de Cypress; virada de página, zoom e redimensionamento foram
verificados à mão no navegador contra uma instalação real.

### Créditos e autoria

- **OJSBR** — https://ojsbr.com.br — concepção, implementação e manutenção.
- **[StPageFlip](https://github.com/Nodlik/StPageFlip)**, de **Nodlik** — MIT — o motor de
  virada de página.
- **[PDF.js](https://github.com/mozilla/pdf.js)**, da **Mozilla** — Apache 2.0 — a
  rasterização do PDF.
- **Public Knowledge Project (PKP)** — o Open Monograph Press e a API de plugins.

### Licença

GNU GPL v3 — veja [`LICENSE`](LICENSE) e [`docs/COPYING`](docs/COPYING). As bibliotecas
vendorizadas mantêm suas próprias licenças (MIT no StPageFlip, Apache 2.0 no PDF.js).
