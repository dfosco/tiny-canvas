# tiny-canvas JSONL consumer implementation plan

## Work identities and boundaries

- Consumer checkout: `/Users/danielfosco/workspace/tiny-canvas`, Git remote `https://github.com/dfosco/tiny-canvas.git`, Paseo workspace `wks_33611c257eefb326`, project `prj_4abfd19df9bd90a4`, active agent `bbb79999-ae1b-49fd-a118-eef4a88c3bed`, `ParentAgentId: null`.
- Provider checkout: `/Users/danielfosco/workspace/hypercanvas`, Git remote `https://github.com/dfosco/hypercanvas.git`, manager workspace `wks_dee2b0b9c4a38079`, integration Goal `#g161`.
- Provider contract: accepted Goal `#g158`, commit `be536ef58f9cf8f7dbad6d111ca7e7988791938c`; strict validator correction `3a1b750cfb5622210e528d7b318513289287f9a9`.
- tiny-canvas owns its source and Lanes records. Hypercanvas owns public API/build/config repair and any changes to contract source. Coordinate portable artifact qualification with B (`d3264103-6644-427a-b95c-c27cf020e300`). Do not change Hypercanvas files, weaken its guards, or accept an artifact until its integrated qualification gate is clear.
- tiny-canvas remains a read-only consumer. No filesystem writes, mutation service, or source-code serialization. Drag and resize state remains browser-local.

## Contract to consume

Use `@dfosco/hypercanvas/canvas/materializer` and `@dfosco/hypercanvas/canvas/document.schema.json` as the sole playback/validation contract. Browser playback uses the provider's `validateCanvasJsonl` before materialization so malformed streams, duplicate headers, unsupported format versions, incomplete v2 geometry, and unknown required events display diagnostics rather than stale content. Preserve v1 legacy default `scroll.axis = both`, v2 atomic layout semantics, and ordered event replay. Unknown optional events may be ignored. The accepted v2 `canvas_layout_restored` event is `required: true` with action `undo | redo`; the public helpers are `captureCanvasLayoutRestoration` and `reverseCanvasLayoutRestoration`. Unknown required events and malformed restoration records must fail closed.

Discover `.canvas.jsonl` files through the existing Vite plugin boundary and expose a virtual registry that uses Vite-managed raw imports and normal HMR. Import local raster/vector assets with Vite `?url` imports so production paths are emitted by the host build. Keep the existing TSX canvas registry and JSX authoring API unchanged. Avoid Node filesystem or Core imports in browser runtime code. Resolve document routes and image resources against Vite `base` and the configured canvas route base.

Map the reference widgets with their persisted IDs and geometry:

- `sticky-note` to Tiny Canvas `Note`.
- `markdown` to `Mark`.
- `image` to `Image` when the resource URL resolves locally or by URL.
- `link` to `Link` with supported URL/title metadata.
- `prototype` to interaction-gated `Frame` using the document's local route, preserving query and hash state.
- JSX `sources` are executable companions, not JSON content. Render an export only when a host module binding explicitly resolves it; otherwise report that source export as an unavailable companion. Do not infer/serialize JSX from export names.
- Report connectors and unknown required widgets/events as explicit unsupported capabilities. Do not silently omit required content.

## Browser-local geometry ownership

Store document layout overrides under a versioned tiny-canvas-specific localStorage namespace and document identity. Each override records the source geometry it was based on. Apply it only while current source geometry still matches that basis; changed source geometry wins and stale overrides are ignored. Provide a clear reset action. Do not write document files or call a mutation endpoint. Keep existing JSX canvas localStorage behavior intact.

## Package boundary decision

`@dfosco/tiny-canvas/canvas-document` is a separate ESM entry and has an optional `@dfosco/hypercanvas` peer dependency. The existing root JSX API does not import the provider package. Consumers of the JSONL entry must install the provider package version that supplies `@dfosco/hypercanvas/canvas/materializer`. The materializer's observed runtime chain is `materializer.js -> canvasEvents.js -> zod`; no Node, Core, server, app, or Paseo module appeared. Hypercanvas owns the 55 declared dependencies and its package qualification. tiny-canvas does not duplicate its parser or validator.

## Execution and verification

1. Implement a Vite discovery/virtual-module seam and prove stable route identity, nested document discovery, Vite-base URLs, add/change/remove invalidation, and no server-only browser imports.
2. Implement validated document rendering and explicit capability diagnostics. Exercise the shared button-patterns reference fixture and preserve all shared protocol fixtures, including unknown-required. Verify stable widget IDs and demonstrate JSX companion limitations.
3. Implement isolated browser-local geometry overrides with source-basis conflict behavior and reset. Verify malformed/newer documents clear the view to diagnostics and source edits supersede stale local geometry.
4. Run Vitest coverage, package and demo builds, and a packed consumer build/render check after the provider artifact qualification. Do not publish or require an npm release.

## Acceptance evidence

Capture evidence against the exact tiny-canvas commit and working-tree diff. Keep criterion evidence in `#g001` tasks. Native app and native interaction acceptance are outside this task; headless browser/build evidence does not claim them.

## Current implementation and qualification evidence

- Vite discovery, virtual registry, watched add/change/remove behavior, base-aware route metadata, and emitted local asset URLs are implemented in `packages/tiny-canvas/src/vite.js`. JSX page discovery remains in the same plugin.
- The `canvas-document` entry validates before replay and maps sticky notes, Markdown, images, links, local prototype frames, and explicitly supplied JSX companion components. Unsupported types, connectors, missing source bindings, invalid geometry, or unsupported fields produce visible diagnostics. Validation errors return diagnostics without a Canvas tree.
- Local overrides use `tiny-canvas:canvas-document-layout:v1:<document-id>`, store full source-basis geometry, and apply only while the current basis matches. Drag/resize commits update only this browser key. Reset removes only that key.
- The shared button-patterns fixture and all shared protocol fixtures are copied into `packages/tiny-canvas/test/fixtures/canvas-document/`. Vitest covers route discovery/HMR, projection, mapping limits, source basis conflicts, local namespace/reset, and fixture retention.
- Final provider basis is accepted Hypercanvas commit `498d5d03defaf2cb8b0a8a896d6e6f63276c6e77`, patch SHA-256 `dc852514e593f0b7f17f215ca2f9a772ea194d7ac3084f2716ca0121dcfe946e`. It was exported with `git archive` from the exact commit. The packed provider artifact `/tmp/hypercanvas-provider-artifacts-498/dfosco-hypercanvas-0.70.0-beta.0.tgz` has SHA-256 `f2d9d9da5b348bb88d432d42aedbd357ad9db26d61242dac27cddee4ac04eada`. Tiny-canvas source is commit `c58e35db08c2c0ec7b452382b31b402cefb90ec1`; its packed artifact `/tmp/tiny-canvas-artifacts-c58/dfosco-tiny-canvas-5.5.0.tgz` has SHA-256 `60ee26159a26b2281ab1b60e367de948c1ad14c9d130d64cd902395d6d88c5d0`. The isolated npm-installed consumer imported both public materializer/schema subpaths and compiled strict `CanvasState`, restoration event/helper, schema, and `CanvasDocumentProps` types. The provider probe exercised all ten shared fixtures: v1 axis default, v2 layout/restoration, rejected missing restoration value, and unknown-required incompatibility. Capture/reverse helpers round-tripped absent props-container undo/redo.
- The isolated npm-installed consumer used the packed provider and tiny-canvas tarballs plus React 18.3.1, React DOM 18.3.1, Vite 6.4.1, its React plugin, and TypeScript 5.8.3. There were no workspace `node_modules` symlinks. Strict public type imports and runtime imports passed. Headless Chromium loaded the installed tiny-canvas package under Vite base `/branch--demo/`: the shared reference JSONL rendered with explicitly bound JSX companions; a branch-prefixed image loaded with query/hash preserved; the prototype iframe retained branch path, query, embed parameter, and hash; dragging a note persisted a namespaced override in browser localStorage. Browser/network console errors were empty, and the fixture SHA-256 was unchanged. npm reported blocked lifecycle scripts for `core-js` and `esbuild`, but Vite ran and the consumer check passed. This is not a claim of separate qualification of all 55 provider dependencies or native app acceptance. The separate Hypercanvas source-edit/HMR/frame journey remains owned by I.
- No npm package was published. Focused model/layout tests passed (11 tests across 2 files), the tiny-canvas package build passed, and `git diff --check` passed. The tiny-canvas checkout has no new source changes after commit `c58e35db08c2c0ec7b452382b31b402cefb90ec1`. Native visible-app acceptance is not claimed.
