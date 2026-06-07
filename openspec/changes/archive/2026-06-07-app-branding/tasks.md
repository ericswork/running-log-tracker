## 1. Brand color tokens

- [x] 1.1 In `client/src/index.css`, set `--primary`/`--primary-foreground`/`--ring` to the green/teal values in **both** the `:root` (light) and `.dark` blocks (start from the design D1 table; tune visually)
- [x] 1.2 Visually verify contrast in light and dark: buttons, selected run-type chips, focus rings, and the dashboard "hide empty weeks" checkbox; nudge the oklch L values if anything reads low-contrast

## 2. Header logo mark

- [x] 2.1 In `components/layout/AppShell.tsx`, render the Lucide `Footprints` mark beside the "Running Log" title, sized to the title and colored `text-primary`, marked `aria-hidden` (the `<h1>` keeps the accessible name)

## 3. Favicon & document title

- [x] 3.1 Replace `client/public/favicon.svg` with a self-contained `Footprints` SVG using an explicit brand color (so it reads on any tab background)
- [x] 3.2 Set `<title>` to "Running Log" in `client/index.html` (keep the existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`)

## 4. Test & verify

- [x] 4.1 Add/extend an RTL test asserting the header renders the "Running Log" title and the logo mark is present
- [x] 4.2 Run `npm --prefix client test` — all frontend tests pass
- [x] 4.3 Manual check in `npm run dev`: brand color across light/dark, header mark, and the favicon/title in the browser tab

## 5. Wrap-up

- [x] 5.1 Update `CLAUDE.md` (UI stack / app-shell notes for the brand tokens + logo mark) and status/continuity
- [x] 5.2 Confirm change ready for `/opsx:archive` (tag target `v0.5.0`)
