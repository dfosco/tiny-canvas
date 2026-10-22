---
name: tiny-board
description: Author Tiny Canvas JSX boards, JSONL documents, Frames, snapshots, routes, and local layouts in this repository or an ordinary npm consumer.
---

# Tiny Board

Use this skill when creating or editing a Tiny Canvas board or consuming a Hypercanvas JSONL canvas in a normal React/Vite app.

## Choose the project surface

- In an ordinary consumer repository, use installed public entries such as `@dfosco/tiny-canvas`, `@dfosco/tiny-canvas/vite`, `@dfosco/tiny-canvas/canvas-document`, and `@dfosco/tiny-canvas/snapshot`. Do not require monorepo source paths, aliases, package links, or private services.
- In this monorepo, read the page, `packages/tiny-canvas/src/index.d.ts`, package README, and demo Vite configuration before changing package internals.
- For JSONL rendering, install the matching `@dfosco/hypercanvas` dependency and use its public `@dfosco/hypercanvas/canvas/materializer` contract through the Tiny Canvas renderer. Keep the browser import graph on the public browser-neutral canvas entry; do not import the Hypercanvas app/Core or Paseo to render a document.

## Authoring and ownership

1. Preserve existing widget IDs and React keys unless new persisted identity is intentional.
2. Keep application UI inside authorized Canvas children. Source exports are executable JSX companions: bind imported components explicitly through `sourceExports`; do not describe arbitrary source code as serialized document data.
3. Use complete same-origin Statefully URLs in a `Frame` route. Preserve query strings and hashes. Use `element` for the target ID and `offset` for additional vertical context.
4. Keep source files, JSONL, image assets, and prototype modules as owner-authored inputs. Vite `dist/` is generated output; change source and rebuild instead of editing generated files.
5. JSONL documents are read-only in Tiny Canvas. Drag/resize overrides belong to browser-local storage and never write shared files. Reset removes the current document's local override profile.
6. Surface unsupported required capabilities, connectors, malformed documents, and missing assets with their diagnostics. Do not silently drop a record and present the remaining canvas as complete.

## Ordinary Vite consumer

The public Vite plugin discovers `.canvas.jsonl` files under `src/canvas` by default and exposes `virtual:tiny-canvas-documents`. It resolves local image assets in that document tree to Vite URLs. Configure `documentsPath`, `routeBase`, or `resolveDocumentRoute` when the app uses another route convention. The plugin does not add routes to the host router; register each document route using the app's normal router and keep its SPA fallback enabled for static hosting.

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tinyCanvas from '@dfosco/tiny-canvas/vite';

export default defineConfig({
  plugins: [react(), tinyCanvas({ documentsPath: 'src/canvas', routeBase: '/canvas' })],
});
```

```jsx
import CanvasDocument from '@dfosco/tiny-canvas/canvas-document';
import documents from 'virtual:tiny-canvas-documents';
import '@dfosco/tiny-canvas/style.css';

const document = documents.find((item) => item.id === '/canvas/review');
export function ReviewCanvas() {
  return document ? <CanvasDocument {...document} /> : null;
}
```

Run the consumer's normal `npm run dev` and `npm run build` commands. Use Vite's `base` for root, subpath, or branch deployment. Copy only exact public package archives into an example when prerelease package proof is needed; use relative `file:` dependencies and record source commit/checksum. Do not add workstation paths or release those artifacts as part of a consumer proof.

## Snapshots

The package CLI accepts files or directories, captures both themes by default, preserves URL hashes, waits for the configured target, and updates self-closing Frame snapshot props. Run it from a consumer project with its normal dependencies and a configured Playwright browser:

```bash
npx tiny-canvas-snap src/pages
```

Dynamic routes unsupported by static analysis and missing target IDs must fail. Loaded same-origin Frames can copy their current visible viewport from the Frame header. Dormant snapshot-backed Frames copy their poster. Cross-origin live DOM capture is unavailable because of browser origin rules. Reuse these Frame snapshot/storage/resource contracts instead of building a second capture subsystem.

## Validation

Verify stable IDs, exact route/query/hash, required diagnostics, deep links, refresh, interaction-gated loading, emitted local assets, and behavior after moving a production build. For source edits, check the actual Frame in the Vite browser pipeline. Keep tests and build artifacts in the consumer project; do not require Paseo, the Hypercanvas app, Core server, or a private resolver.
