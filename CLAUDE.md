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

**Astro 7 static site** for Códice Clínico — a SaaS clinical records product targeting Spanish-speaking private clinics. Deploys to Cloudflare Workers via `@astrojs/cloudflare`.

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

Components use `interface Props` with destructuring from `Astro.props` and explicit default values. All styling is inline Tailwind — no scoped `<style>` blocks.

**`Container.astro`** wraps every page section. Props: `variant` (`default` adds `py-16`, `hero` adds tall top padding), `classSection`, `classMaxWidth`. Inner `<div class={classMaxWidth}>` controls content width — pass `max-w-6xl`, `max-w-3xl`, or `max-w-md`.

**`Button.astro`** is the only CTA link component. Variants: `primary` (indigo bg), `ghost` (transparent + border), `sky` (sky bg, for use on dark backgrounds), `light` (cream bg, for use on dark backgrounds), `cpt` (text link with animated `→` arrow). Sizes: `xs`, `sm`, `md`, `lg`.

**`Heading.astro`** accepts `maintitle`, optional `eyebrow` (boolean that renders an `Eyebrow.astro` dot), `variant` (`h1`–`h6`), and `theme` (`default` | `on-dark`).

**`Eyebrow.astro`** es solo un icono `Circle` de Lucide — el punto decorativo sky con halo que precede a los títulos. Props: `variant` (`default` | `on-dark`), `size` (string, default `"14"`). No acepta texto ni `label`; el texto del eyebrow va directamente en el componente padre.

**`Card.astro`** accepts `icon` (Lucide component), `gradientBar` (boolean — adds 4px indigo→sky top bar), and `class`.

**`CTABanner.astro`** is the full-width dark CTA block used at the bottom of pages. Self-contained, no props needed.

### Styling

Tailwind v4 via Vite plugin (no `tailwind.config.*` file). All tokens live in `src/styles/global.css` under `@theme`. Fonts are declared in `src/styles/fonts.css`.

**Color palette** (OKLCH, full 50–950 scales):
- `m-indigo-*` — primary (500: deep indigo `#212163`, 950: near-black)
- `m-sky-*` — accent (500: sky blue `#5dc4f7`, 50: light chip color)
- `m-cream-*` — warm surfaces (50: `#fafaf7`)
- `m-gray-*` — muted/borders (50: semi-transparent border at 9% opacity, 500: muted text)
- `m-blue-*`, `m-red-*`, `m-green-*` — legacy/utility scales
- `color-background` — warm paper `oklch(0.9588 0.0127 86.83)`
- `color-text` — near-black ink

**Typography** — escala única `text-xs` → `text-20xl` con line-heights proporcionales. Correspondencia aproximada con el diseño: H1 hero ≈ `text-11xl`, H2 sección ≈ `text-7xl`, H3 card ≈ `text-2xl`, subtítulo/lead ≈ `text-2xl`–`text-4xl`. Fonts: `font-sans` = Manrope, `font-mono` = JetBrains Mono (para eyebrows, labels, datos técnicos).

**Shadows**: `shadow-md`, `shadow-lg`, `shadow-card` are overridden in `@theme` with brand-specific values.

**`@layer components`** defines `.eyebrow` and `.eyebrow-on-dark` — the mono uppercase label with sky dot. Use the `Eyebrow.astro` component instead of applying these classes directly.

**Gradients** (use only these):
- Hero/header glow: radial sky glow, top-left, blur 8px
- Dark CTA: `linear-gradient(160deg, #212163, #121238)` + sky radial overlay at 85% 10%
- Gradient bar on cards: `bg-linear-to-r from-m-indigo-500 to-m-sky-500`

**Radii**: `rounded-xl` (10px), `rounded-2xl` (16px), `rounded-3xl` (24px), `rounded-4xl` (32px), `rounded-full` (pills).

### Path Aliases (tsconfig)

`@components`, `@layouts`, `@assets`, `@data`, `@hooks`, `@styles`, `@utils` all resolve under `src/`.

### Icons

Lucide Icons via `@lucide/astro`. Import named components: `import { ArrowRight } from "@lucide/astro"`.

### Deployment

Cloudflare Workers. Config in `wrangler.jsonc` (compatibility date: 2026-04-20). Run `npm run generate-types` after changing Cloudflare bindings.

### Decisiones técnicas

- **Node**: `engines` exige `>=22.23.4` (mínimo de Astro 7). El build en Cloudflare debe usar una versión compatible.
- **Sin override de Vite**: Astro 7 y `@astrojs/cloudflare@14` requieren Vite 8 (`transformWithOxc`). No volver a forzar `"vite": "^7"` en `overrides`.
- **`output: "static"`**: todo el sitio es estático salvo `src/pages/api/contact.ts` (`prerender = false`), que es la única ruta que ejecuta el Worker. Los assets se sirven sin pasar por él.
- **Secretos en el Worker**: `env` se importa de `cloudflare:workers` (en la v14 ya no existe `Astro.locals.runtime.env`). `HUBSPOT_API_KEY` está en `secrets.required` de `wrangler.jsonc` y en `.dev.vars` en local. `worker-configuration.d.ts` se genera con `wrangler types` (lo ejecuta `npm run build`) y no se versiona.
- **Formulario (`/api/contact`)**: solo exporta `POST` (otros métodos dan 404 por defecto de Astro). Valida con Zod y crea el contacto en HubSpot; un 409 se trata como éxito (`existing: true`). Sin CORS porque `Form.astro` hace fetch al mismo origen.
- **Anti-spam**: `Form.astro` incluye un honeypot oculto (`website`); si llega con valor, `/api/contact` responde éxito sin llamar a HubSpot. No se monta Turnstile por ahora (sin tráfico ni spam). **Si se reciben leads falsos, implementar Turnstile** (widget en `Form.astro` + `siteverify` en `contact.ts`, con `TURNSTILE_SECRET` como secreto del Worker).
- **Bindings automáticos del adaptador**: añade `SESSION` (KV) e `IMAGES` aunque el sitio no use sesiones ni `astro:assets`. Se pueden ajustar con `sessionKVBindingName` / `imageService`.
- **Sin CHANGELOG**: no hay releases ni consumidores de versiones; el historial está en git y en las PRs.

### Design reference

Prototype HTML files and the reference CSS live in `docs/design/prototipos/`. Open the `.html` files in a browser alongside `codice-web.css` to see the target design. These are references only — translate to Tailwind, do not copy CSS verbatim. Width breakpoints in the prototypes (1200px / 760px / 480px) map to `max-w-6xl` / `max-w-3xl` / `max-w-md` in Tailwind.
