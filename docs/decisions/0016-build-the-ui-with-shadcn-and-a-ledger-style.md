# 16. Build the UI with shadcn/ui and the "achromatic ledger" style

Date: 2026-11-01

## Status

Accepted. Colour rules amended by [ADR 17](0017-give-homedash-a-brand-colour-and-purposeful-motion.md).

## Context

The author wants a UI that is reliable, accessible and clean, "nothing fancy", and that does not look AI-generated. Generated interfaces tend to look the same: gradients, glass panels, icons in tinted squares, coloured sidebars, pill badges everywhere. We considered decorative component collections built on shadcn (e.g. Glassy UI). Their glass effects cost readability and performance, and they are exactly that generic look.

## Decision

- **Components:** [shadcn/ui](https://ui.shadcn.com/) on Radix (preset "Nova", Lucide icons). The components are copied into `web/src/components/ui/` and belong to us, so we may edit them. Radix provides the accessibility (focus, keyboard, ARIA).
- **Design direction:** the [taste-skill](https://github.com/Leonxlnx/taste-skill)'s app-screen rules, with the style it dealt for homedash: **achromatic ledger**, light, seed 361153232 (recorded in `.taste-skill/direction.json`).
  - **No colour in the chrome:** the one primary action is near-black, everything else is ink and greys.
  - **One data hue** (`--data`, blue) for what is due today, and a **negative** red only on the overdue fact.
  - **Surfaces:** a warm stone ground (`#f4f3f1`, the home's "face") under white panels with a 1px border, no shadow at rest, an 8px radius.
  - **Type:** Geist, bundled locally; sizes 12/14/16/24; numbers in tabular figures.
  - **Words:** each screen has a noun title, one "finding" line under it (the fact that most needs attention), and the product's own words ("Overdue", "Today", "Next 7 days", "Later", "No due date").
  - **States:** an empty list keeps its frame with one sentence, loading shows the final layout in still grey bars, and errors stay inside the block that failed, with a retry.
  - **Shell:** a slim top bar over a centred column while there are few screens. Switch to the style's icon rail once groceries, purchases and the car exist.
- **Checks:** `.taste-skill` checks are run on UI changes: `lint.mjs --app` on the sources and `inspect.mjs --app` on the production build, at 1440, 768 and 390px.

## Consequences

- Every screen looks like part of one product, and new screens have rules to follow instead of defaults.
- Owning the component code means we also patch it. We already removed the dialogs' backdrop blur, the skeleton pulse and `transition-all`.
- The taste-skill is a global, third-party tool; its checks are advisory and not part of CI.
