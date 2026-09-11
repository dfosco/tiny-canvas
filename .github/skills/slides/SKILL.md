---
name: slides
description: Create or modify Tiny Canvas Slides decks, stateful URLs, cursor and click steps, host routing, snapshots, and keyboard navigation.
---

# Slides

Use this skill for the `Slides` package surface and demo presentations.

## Required context

Read `MODEL.md`, the deck definition, `packages/tiny-canvas/src/Slides.jsx`,
`packages/tiny-canvas/src/slidesModel.js`, and the host route before changing
behavior.

## Rules

1. `Slides` is a top-level package surface beside `Canvas`, not a Canvas child.
2. A slide `url` is its base state. `steps` is an ordered list of cursor and
   click intermediaries.
3. Step indices are one-based. Package slide indices are zero-based; host URLs
   may expose one-based slide numbers.
4. Host routing is optional. When used, replace step URL entries and allow slide
   changes to create history entries.
5. Preserve complete Statefully hashes, query values, and other host-owned URL
   state.
6. Click steps update the mounted same-origin iframe and preserve scroll.
7. Cursor steps require a stable target ID and may use `scrollOffset`.
8. Conclusions keep the final iframe mounted beneath the scrim.
9. Preserve `Command+K`, `Command+Shift+K`, and `Command+J`.
10. Use the neutral `--tc-slides-*`/shadcn-style token contract. Do not add
    Primer, Tailwind, or shadcn runtime dependencies for the panel.

## Validation

Run focused Slides model/component tests, build the package and demo, then open
a direct deck/slide/step URL and verify Statefully restoration, cursor offsets,
click scroll preservation, keyboard progression, active new-tab URLs, and the
conclusion.
