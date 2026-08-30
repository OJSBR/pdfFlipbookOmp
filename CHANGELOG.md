# Changelog

All notable changes to this plugin are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
version numbers follow the PKP four-part scheme used in `version.xml`.

## [Unreleased]

## [0.3.0.3] - 2026-08-30

### Fixed
- **The button never appeared on a chapter's own landing page.** The plugin
  hooked `Templates::Catalog::Book::Details`, and OMP does not call that hook on
  the chapter page — it has its own, `Templates::Catalog::Chapter::*`. So on a
  book with chapters, the button was missing from exactly the page the reader
  lands on. Both hooks are now registered.
- **The button did not look like a button outside the publication-format box.**
  It was injected as a bare anchor and relied on the theme styling any link in
  its neighbourhood — true inside `.pub_format_*`, false in a chapter list, where
  only `.cmp_download_link` is styled and the button rendered as underlined text
  among real buttons. It now copies the class list of the PDF link next to it
  before adding its own, so it is a visual sibling of that link in any context
  and under any theme, instead of depending on one theme's generosity.

## [0.3.0.2] - 2026-08-30

### Fixed
- The button's icon rendered as an empty box wherever the theme does not style
  the surrounding links. The `::before` carried the FontAwesome codepoint but
  inherited the body font, so the glyph had nowhere to come from. It showed up
  correctly next to the book's own PDF only because the theme applies FontAwesome
  to download links inside the publication-format box; in a **chapter list**,
  where the same button is injected, the container gets no such treatment and the
  reader saw a tofu box. The font is now declared on the pseudo-element itself
  instead of being inherited.

## [0.3.0.1] - 2026-08-30

### Added
- Cypress specs (`cypress/tests/functional/PdfFlipbook.cy.js`): enabling the plugin,
  the flipbook button appearing next to the ordinary PDF link and the pages actually
  rendering, and navigation, zoom and the way back to the book page.
- A live demo link in the README.

## [0.3.0.0] - 2026-08-30

### Added
- First public release. Renders a PDF publication format as a page-turning book
  using StPageFlip and PDF.js, both vendored — no CDN. A "Read in flipbook" button
  sits next to the ordinary PDF link, so the traditional viewer stays untouched
  and the reader chooses.
- Lazy rendering with a bounded page cache, zoom from 0.5x to 2.5x, fullscreen,
  and remount on resize.
- Unit tests covering the rule that decides when the plugin takes over the
  request and locale integrity across all 38 locales.

[Unreleased]: https://github.com/OJSBR/pdfFlipbookOmp/compare/0.3.0.3-omp3.5...stable-3_5_0
[0.3.0.3]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.3-omp3.5
[0.3.0.2]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.2-omp3.5
[0.3.0.1]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.1-omp3.5
[0.3.0.0]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.0-omp3.5
