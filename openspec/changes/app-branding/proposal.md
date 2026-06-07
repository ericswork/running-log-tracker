## Why

The app works but looks unbranded: the accent color is the stock shadcn neutral (near-black/near-white), there's no logo, the browser tab still reads the default title **"client"** with a placeholder favicon. A light brand pass — a fresh green/teal accent, a logo mark in the header, and a matching favicon/title — gives "Running Log" a bit of identity without a full redesign. Frontend-only; no data or behavior changes. Targets release v0.4.1.

## What Changes

- **Brand accent color** — set the shadcn brand tokens (`--primary`, `--primary-foreground`, `--ring`) to a fresh **green/teal** hue in **both** the light and dark blocks of `client/src/index.css`. Buttons, selected run-type chips, and focus rings pick this up automatically. Chart tokens (`--chart-1..5`) are left as-is (already a working palette).
- **Logo mark** — render a **Lucide `Footprints`** icon beside the "Running Log" title in the header (`AppShell`), colored with the brand token.
- **Favicon + document title** — replace the placeholder `favicon.svg` with a `Footprints`-based SVG mark, and set the document `<title>` to **"Running Log"** (currently "client").
- **Keep the name** "Running Log" — no rename.
- **Test** — a small RTL assertion that the header renders the title and the logo mark. The color tokens and favicon are visual and verified manually (jsdom can't assert them).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `app-shell`: gains a branding requirement — a brand accent color applied across light/dark, a logo mark in the header alongside the title, and a branded document title/favicon.

## Impact

- **No new dependencies** (`lucide-react` is already used). No backend, API, or data changes.
- **Client**: `src/index.css` (theme tokens, light + dark), `components/layout/AppShell.tsx` (logo mark), `index.html` (`<title>` + favicon link), `public/favicon.svg` (replaced). A small addition to the AppShell/header test.
- **Out of scope**: renaming the app, custom/illustrated logo art, typography/font changes, chart-palette restyle, a broader design-system overhaul, and any backend work.
