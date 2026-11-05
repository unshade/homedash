# 17. Give homedash a brand colour and purposeful motion

Date: 2026-11-01

## Status

Accepted. Amends the colour rules of [ADR 16](0016-build-the-ui-with-shadcn-and-a-ledger-style.md).

## Context

With ADR 16's "achromatic ledger" style (no colour at all in the chrome), the author found the todos screen "very sad" and asked for something livelier and more visually appealing, "not too much".

We considered [Glassy UI](https://glassyui.com/), a shadcn registry of glass components. Glass only works over a colourful backdrop (a photo or gradient wallpaper), costs readability and performance on modest phones, and is the look many generated apps share. We rejected it. A playful pastel style (soft tiles in many colours, bouncy motion) was also offered; the author chose a brand colour with purposeful motion.

## Decision

- **Brand colour:** homedash has one, a garden green: `#2f6b4b` in light mode and `#6fcf97` in dark mode, as `--primary`.
  - It marks the main action, checked boxes, focus rings, the logo, what is due today (`--data`) and progress.
  - Red (`--negative`) stays reserved for what is overdue.
  - Every text pairing keeps a 4.5:1 contrast ratio or better.
- **Soft tints:** due groups are soft bands with their count. The overdue band is red at 8%, the today band green at 8%, the others muted grey.
- **Progress:** the title row shows how much of this week's todos (Monday to Sunday, by due date) is done, as a bar in the brand colour.
- **Motion:** decided with the `animate` skill (Emil Kowalski's rules). It is purposeful, short, uses transform and opacity only, and has a reduced-motion variant that keeps a short fade without movement.
  - **Check feedback:** the tick settles in over 150ms (CSS `@starting-style`).
  - **Spatial consistency:** a todo glides to its new group, or to Done, over 250ms with a strong ease-in-out. React's `<ViewTransition>` does this with the browser's View Transitions API, with no animation library. The list renders from `useDeferredValue`, so a refetch counts as a transition.
  - **Arrival:** a new todo fades and rises in over 200ms, and a deleted one fades out over 150ms.
  - **Progress:** the week bar eases to its new value over 250ms when a todo is checked.
  - Shared curves live in `index.css` (`--ease-out`, `--ease-in-out`).
- **What stays from ADR 16:** shadcn/ui, the stone ground and white panels, no gradients, glass, glows or resting shadows, one typeface, the finding line, honest states, the taste-skill checks.

## Consequences

- The screen has an identity and reads at a glance, while staying calm and accessible.
- Browsers without the View Transitions API, and the test environment (jsdom), simply skip the animations.
- Motion is limited to feedback, spatial consistency and arrival. New animations need a named purpose, the same tokens, and a reduced-motion variant.
