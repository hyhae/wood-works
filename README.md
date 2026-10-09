# Woodwork furniture catalog

A SvelteKit 3 / Svelte 5 furniture showcase with a browser-local CMS. The production output is static: no backend, purchasing flow, or external content service.

## Run locally

Use Node **22.18 or newer** (Node 24 LTS recommended).

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Public pages are `/`, `/products/`, `/products/<slug>/`, `/about/`, and `/contact/`.

## Admin

Open `/admin/` on the same origin.

- Username: **admin**
- Password: **admin123**

Credentials are defined in `src/lib/admin/credentials.ts`. This hardcoded frontend login is a convenience gate, **not secure authentication**. It is visible in browser code and can be bypassed. It has no publishing credentials, access to other visitors' browsers, or server-side privileges. Do not store confidential information in this app. Hidden products are excluded from browsing, but bundled catalog content is not secret.

The unlocked flag lasts for the current browser tab session. Logout removes it; saved drafts remain. Products, categories, site content, and images are saved to IndexedDB only when you use the relevant Save button. Navigating away with unsaved changes prompts before discarding them.

Use **Site Content** to replace the temporary brand, upload a logo, edit homepage/About Us copy and photos, and add real contact and Facebook/Instagram details. Blank contact/social settings produce no fake links. WhatsApp numbers should include the country code. Every product needs a positive price and at least one image with alternative text. Currency changes relabel prices and do not convert their amounts.

Drafts are specific to a browser profile and origin (including the port). They do not automatically synchronize between devices, ports, visitors, or deployments. Clearing site storage removes them. Export backups regularly.

## Preview and publish

1. Save changes in the editor.
2. Open **Import / Export → Preview draft**. The preview uses saved local content and uploaded images. Normal storefront pages continue showing the built catalog.
3. Click **Export content ZIP**. It includes `src/lib/content/site.json` and every referenced asset under `static/media/`.
4. Import the ZIP from the terminal in this project:

```sh
npm run import:content -- "/path/to/woodwork-content-2026-10-09.zip"
```

The command also accepts an already extracted export directory. It validates the content and images before updating only `src/lib/content/site.json` and the referenced files in `static/media/`. Existing application code and unreferenced images are retained. Do not replace the project's `src/` or `static/` folders with exported folders: an export contains content and images, not the application source.

5. Validate and build:

```sh
npm run check
npm test
npm run build
npm run preview
```

6. Deploy **the contents of `build/`** to a static host. Use the build command `npm run build` and output directory `build`. Routes are directories with `index.html`; retain those directories and `_app/` assets. Configure your host's not-found page to `404.html` where supported. The app expects hosting at the domain root.

You must rebuild after content changes so new product URLs are prerendered. Changes to a product slug invalidate its old URL; keep slugs stable unless you intend that change. Publishing is manual, and the admin intentionally has no direct deploy button.

**Import content ZIP** validates the schema, references, image files, allowed paths, and archive limits before replacing the local draft. An invalid import leaves the existing saved draft untouched. **Reset local draft** restores the currently built catalog; export a backup first.

## Content and images

- Publishable source: `src/lib/content/site.json`.
- Image assets: `static/media/`.
- Schema and relationship checks: `src/lib/admin/validation.ts`.
- Static build validation: `scripts/validate-content.ts`.

The initial seven products, prices, dimensions, materials, copy, and imagery are illustrative. Replace them before publishing a real business catalog, then disable the sample notice in Site Content. No testimonials or business credentials have been invented.

Development and production builds generate responsive WebP sizes automatically from referenced original images. Generated variants are ignored by Git and regenerated when building an exported catalog. The ZIP only needs to carry the originals. Run `npm run optimize:images` manually if needed.

Uploads accept JPEG, PNG, or WebP up to 25 MB and resize to a maximum edge of 1600px. They are converted to WebP where supported. Export/import has a 100 MB compressed and uncompressed limit. ZIP processing is loaded only when needed. The public catalog does not load the CMS, validation, IndexedDB, or ZIP modules.

All eight project images were generated using the built-in image-generation tool, then converted to WebP. Their prompt set is recorded in [docs/image-prompts.md](docs/image-prompts.md). They are local assets, with no stock-photo or image-generation API calls at runtime. A hero image and product photos may depict different sample furniture; these are illustrative concepts rather than real inventory.

## Checks

```sh
npm run check           # Svelte and TypeScript
npm test                # Catalog, validation, and ZIP workflow
npm run build           # Validate content/assets and prerender
npx playwright install chromium  # First-time browser setup, if needed
npm run test:e2e        # Production-build browser tests
node scripts/publish-smoke.ts # Rebuild an exported catalog in a temporary project
```

The browser suite starts a temporary production preview on port 4173. Tests cover public navigation, filters/search/sorting, direct URLs, login gating/logout, persistent drafts, uploads, inquiry links, export/import, validation failures, mobile overflow, and automated accessibility in light/dark themes. Build first.

Typography is self-hosted Manrope. Icons use Tabler. Styling is native CSS with a silver/charcoal palette and muted green accent. Theme preference is saved locally; motion respects reduced-motion settings.
