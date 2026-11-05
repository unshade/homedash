# 22. Restyle homedash as a calm glass dashboard

Date: 2026-11-05

## Status

Accepted. Supersedes [ADR 16](0016-build-the-ui-with-shadcn-and-a-ledger-style.md) and [ADR 17](0017-give-homedash-a-brand-colour-and-purposeful-motion.md) (their look; shadcn/ui, the motion rules for todos and the accessibility rules stay).

## Context

The author found the restrained "ledger" style of ADR 16 and 17 "very lame". A first redesign followed a dark "Dashboard Dark Mode UI" shot (violet night, glowing gradients, moving light); the author then changed their mind for a "very calm, cosy and pro" style, after two shots of a meditation app ("Sense"): a pale ground washed with peach and lavender light, frosted white glass cards with bright rims, soft pastel artwork, a coral orb, rounded geometric type.

Glass has real costs: `backdrop-filter` is expensive (worst on phones), text on translucent surfaces can lose contrast, and some people ask their system for less transparency or less motion.

## Decision

- **Light only.** A pale ground (`#f1f0f2`) with still washes of peach (bottom left), lavender (bottom right) and blush (top) (`components/backdrop.tsx`). `color-scheme: light`; shadcn's `dark:` variants never apply. Nothing in the background moves: calm.
- **Frosted glass** as utilities in `index.css`: `glass` for panels and the floating sidebar (white at 40–62%, a 1.5px white rim, a soft violet-grey shadow, `backdrop-filter: blur(24px)`), `glass-strong` for what floats above (dialogs, menus, the phone drawer). Glass is never nested inside glass. Cards are rounded 24px.
- **Ink and coral.** Text is ink (`#2b2730`). The main action is an ink pill with white text; other buttons are white pills. Coral (`#ef6a3c`) marks icons, focus and the current item's icon; the orb gradient (coral → pink → lavender, `bg-brand`) fills checks, progress and chart bars, never behind text. Deep coral (`--data`) marks "today", deep rose overdue, deep green done: all keep 4.5:1 on the glass over the washes.
- **Pastel artwork** for the home stat tiles (`art-peach`, `art-coral`, `art-mint`, `art-lavender`): layered gradients instead of the references' blurred photos, so there are no image files.
- **Poppins** (bundled with `@fontsource/poppins`, 400–700) replaces Geist.
- **A home overview** at `/`: stat tiles, a week bar chart, a progress ring, "Up next" and "Recently done", built only from real feature data (todos for now).
- **Motion** stays transform/opacity and short: cards rise in one after another, bars grow and the ring fills on arrival, with reduced-motion variants.
- **Fallbacks**: `prefers-reduced-transparency: reduce` and browsers without `backdrop-filter` get solid panels with the same rims.
- The taste-skill app-screen rules (ADR 16) no longer apply.

## Consequences

- homedash no longer follows a dark system theme.
- Blur is limited to large surfaces (panels, sidebar, dialogs), never rows, and the background never moves, which keeps the cost of glass low.
- Hand-written SVG charts keep the bundle small; a chart library can be chosen later if charts grow.
- The installed app's icons, theme colour and splash background use the pale ground and the orb-lit logo.
