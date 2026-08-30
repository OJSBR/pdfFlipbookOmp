# Changelog

All notable changes to this plugin are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
version numbers follow the PKP four-part scheme used in `version.xml`.

## [Unreleased]

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

[Unreleased]: https://github.com/OJSBR/pdfFlipbookOmp/compare/0.3.0.1-omp3.5...stable-3_5_0
[0.3.0.1]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.1-omp3.5
[0.3.0.0]: https://github.com/OJSBR/pdfFlipbookOmp/releases/tag/0.3.0.0-omp3.5
