## Context

The theme lives as oklch tokens in `client/src/index.css` — a `:root` (light) block and a `.dark` block — mapped to Tailwind via `@theme inline`; there is no `tailwind.config`. The brand tokens are currently the stock shadcn **neutral** ramp (`--primary` ≈ near-black in light / near-white in dark). The header (`components/layout/AppShell.tsx`) shows a plain "Running Log" text title; `index.html` has the default `<title>client</title>` and a placeholder `favicon.svg`. `lucide-react` is already a dependency. This change applies a light green/teal brand without touching behavior, data, or the chart palette.

## Goals / Non-Goals

**Goals:**
- A fresh green/teal accent applied consistently across light and dark, with adequate contrast.
- A Lucide logo mark in the header and a matching favicon.
- A correct, branded document title.

**Non-Goals:**
- Renaming the app, custom logo art, font/typography changes, restyling the chart palette, or any backend/data work.

## Decisions

### D1 — Re-tint the brand tokens only (`--primary`, `--primary-foreground`, `--ring`), both themes
Changing `--primary` flows through every filled control (buttons, selected run-type chips) and `--ring` through focus states — so a small token edit rebrands the app without touching components. Proposed starting values (tunable at apply time against the real UI):

| Token | Light | Dark |
|---|---|---|
| `--primary` | `oklch(0.52 0.12 180)` | `oklch(0.70 0.13 180)` |
| `--primary-foreground` | `oklch(0.985 0 0)` (white) | `oklch(0.205 0 0)` (near-black) |
| `--ring` | `oklch(0.55 0.10 180)` | `oklch(0.70 0.10 180)` |

Hue ~180 is a teal-leaning green ("fresh green/teal"). Light primary is dark enough for white foreground; dark primary is bright with near-black foreground (matches shadcn's dark-mode inversion). *Alternative considered:* also tinting `--accent` (hover backgrounds) — left neutral to avoid a muddy hover; revisit if it looks flat.

### D2 — Leave `--chart-1..5` as-is
The dashboard palette already reads well and is distinct per series; re-tinting it to match risks reducing series separation for marginal cohesion gain. Out of scope per the locked decision.

### D3 — Logo mark = Lucide `Footprints`, inline in the header
Render `<Footprints>` from `lucide-react` beside the title in `AppShell`, sized to the title and colored `text-primary` so it tracks the brand token in both themes. The title text stays "Running Log"; the icon is decorative (`aria-hidden`), with the existing `<h1>` providing the accessible name. *Alternative considered:* `Activity`/`Route`/`Waypoints` — `Footprints` is the most on-brand for a running log.

### D4 — Favicon = a standalone `Footprints` SVG, themable
Replace `public/favicon.svg` with the Lucide `Footprints` path as a self-contained SVG using `currentColor`/an explicit brand stroke so it reads in browser tabs (light and dark). Keep the existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. Set `<title>` to "Running Log".

### D5 — Test only the structurally assertable parts
RTL can assert the header renders the "Running Log" title and that the mark is present (e.g. an `aria-hidden` SVG / the `h1` accessible name). Color tokens and favicon rendering are not jsdom-testable → manual visual check (light + dark).

## Risks / Trade-offs

- **Contrast on the teal primary** (white text on light primary; dark text on dark-mode primary) → pick L values with enough separation and eyeball both themes during apply; nudge L if buttons look low-contrast.
- **Brand token bleeds into unexpected spots** (anything using `--primary`) → that's the intent, but scan buttons, selected chips, focus rings, and the dashboard checkbox after the change.
- **Favicon SVG must be self-contained** (no external currentColor context in a tab) → give it an explicit brand color so it isn't invisible on certain tab backgrounds.

## Open Questions (sub-decisions, defaults chosen)

- **Icon** — default **`Footprints`** (D3). Swappable to `Activity`/`Route` in one line if preferred.
- **Exact oklch values** — the table in D1 is a starting point; final values tuned visually at apply time.
- **`--accent` tint** — default **leave neutral** (D1); revisit only if hovers look flat.
