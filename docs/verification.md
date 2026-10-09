# Verification

Verified locally on 2026-10-09 against the production static build.

- Svelte / TypeScript: zero errors and warnings.
- Unit tests: 19 passed.
- Chromium browser tests: 6 passed.
- Static build: all public pages, seven product URLs, admin, preview, and 404 output generated.
- Publishing smoke check: an exported catalog rebuilt in an isolated temporary project, produced a new product URL, and omitted a hidden product.
- Browser workflows: filtering/search/sorting, login/error/session/logout, editing, uploads, local draft persistence, product inquiries, ZIP export/restore, rejected imports, category/product creation and deletion, and hiding products.
- Automated WCAG A/AA checks: public pages, login, all CMS sections, and the product editor; tested light and dark themes.
- Mobile overflow checks and desktop/mobile screenshot review completed.
- Visual QA reported no browser runtime errors.

## Lighthouse (mobile simulation)

| Category | Score |
| --- | --- |
| performance | 93 |
| accessibility | 100 |
| best-practices | 100 |
| seo | 100 |

Largest contentful paint: 2.9 s. Cumulative layout shift: 0. Total blocking time: 0 ms.

These are local laboratory results, not field metrics or guarantees for a deployed host. Screenshots and Lighthouse JSON/HTML reports are available in the ignored `qa/` directory. Performance improved with automatically generated responsive WebP sizes.
