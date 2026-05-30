# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build locally
npm run generate-types  # Generate Cloudflare Worker types via wrangler
```

No lint or test commands are configured.

## Architecture

**Astro 6 static site** for Códice Clínico — a SaaS clinical records product targeting Spanish-speaking private clinics. Deploys to Cloudflare Workers via `@astrojs/cloudflare`.

### Routing

File-based routing under `src/pages/`. All routes and content are in Spanish:

- `/` — Home (hero + features + benefits)
- `/nosotros` — About
- `/precios` — Pricing
- `/solicita-demo` — Demo request form
- `/contacto` — Contact
- `/politica-de-privacidad` — Privacy policy

### Layout & Components

`src/layouts/Layout.astro` is the master shell — it accepts `includeHeader`/`includeFooter` booleans plus SEO props (title, description, canonical, og:image). Astro `<ClientRouter />` (view transitions) is enabled globally.

Components use interface-based props with destructuring from `Astro.props`, default values, and `<slot />` for flexible content composition. All styling is inline Tailwind — no scoped `<style>` blocks.

### Styling

Tailwind v4 via Vite plugin (no `tailwind.config.*` file). Theme tokens are defined in `src/styles/global.css` using the `@theme` directive:

- **Colors**: `m-blue-500` (#212163 primary), `m-sky-500` (#5dc4f7), plus `m-red`, `m-green`, `m-gray-*` scale
- **Typography**: custom scale from `text-xs` → `text-20xl` with proportional line-heights
- **Fonts**: Proxima Nova (defined in `src/styles/fonts.css`)

The **Icons** are managed using Lucide.

### Path Aliases (tsconfig)

`@components`, `@layouts`, `@assets`, `@data`, `@hooks`, `@styles`, `@utils` all resolve under `src/`.

### Deployment

Cloudflare Workers. Config in `wrangler.jsonc` (compatibility date: 2026-04-20). Run `npm run generate-types` after changing Cloudflare bindings.
