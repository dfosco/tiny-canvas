---
name: tiny-board
description: Author Tiny Canvas boards, Frames, snapshots, stateful URLs, targets, offsets, and persisted layouts in this repository.
---

# Tiny Board

Use this skill for Canvas pages and their `Block`, `Frame`, `Note`, `Mark`,
`Link`, and `Image` children.

## Authoring

1. Read the page, `packages/tiny-canvas/src/index.d.ts`, package README, and
   demo Vite configuration.
2. Preserve existing widget IDs and React keys unless new persisted identity is
   intentional.
3. Keep application UI inside authorized Canvas children.
4. Use complete same-origin Statefully URLs in `Frame route`; do not strip hash
   overrides.
5. Use `element` for the target ID and `offset` for additional vertical context.
6. Regenerate light and dark snapshots after changing routes, state, dimensions,
   targets, offsets, or visible content.

## Snapshots

```bash
npm run snap --workspace=demo
```

The package CLI accepts files or directories, captures both themes by default,
preserves URL hashes, waits for the configured target, and updates self-closing
Frame snapshot props. Dynamic routes unsupported by static analysis and missing
target IDs must fail.

Loaded same-origin Frames can copy their current visible viewport from the Frame
header. Dormant snapshot-backed Frames copy their poster. Cross-origin live DOM
capture is unavailable because of browser origin rules.

## Validation

Run focused Frame and snapshot tests, package/demo builds, and the snapshot
command. Verify generated images, interaction-gated loading, exact frame URLs,
target alignment, deep links, refresh, and live capture.
