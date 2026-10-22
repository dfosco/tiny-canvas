# tiny-canvas JSONL consumer implementation plan

## Work identities and boundaries

- Consumer checkout: `/Users/danielfosco/workspace/tiny-canvas`, Git remote `https://github.com/dfosco/tiny-canvas.git`, Paseo workspace `wks_33611c257eefb326`, project `prj_4abfd19df9bd90a4`, active agent `bbb79999-ae1b-49fd-a118-eef4a88c3bed`, `ParentAgentId: null`.
- Provider checkout: `/Users/danielfosco/workspace/hypercanvas`, Git remote `https://github.com/dfosco/hypercanvas.git`, manager workspace `wks_dee2b0b9c4a38079`, integration Goal `#g161`.
- Provider contract: accepted Goal `#g158`, commit `be536ef58f9cf8f7dbad6d111ca7e7988791938c`; strict validator correction `3a1b750cfb5622210e528d7b318513289287f9a9`.
- tiny-canvas owns its source and Lanes records. Hypercanvas owns public API/build/config repair and any changes to contract source. Coordinate portable artifact qualification with B (`d3264103-6644-427a-b95c-c27cf020e300`). Do not change Hypercanvas files, weaken its guards, or accept an artifact until its integrated qualification gate is clear.
- tiny-canvas remains a read-only consumer. No filesystem writes, mutation service, or source-code serialization. Drag and resize state remains browser-local.

## Contract to consume

Use `@dfosco/hypercanvas/canvas/materializer` and `@dfosco/hypercanvas/canvas/document.schema.json` as the sole playback/validation contract. Browser playback uses the provider's `validateCanvasJsonl` before materialization so malformed streams, duplicate headers, unsupported format versions, incomplete v2 geometry, and unknown required events display diagnostics rather than stale content. Preserve v1 legacy default `scroll.axis = both`, v2 atomic layout semantics, and ordered event replay. Unknown optional events may be ignored. Do not add or interpret the cross-Goal undo restoration extension until root provides the accepted contract.

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
- Provider basis is Hypercanvas commit `96b4cb99a59bafe7eeeba0d0b7c2d7134dc74619`. Qualified provider artifact: `/tmp/hypercanvas-g155-qualified-consumer-9df0adc5/dfosco-hypercanvas-0.70.0-beta.0.tgz`, SHA-256 `8eed62332ca45a0a7796eb6e7c0fe5887d1bee7ef7dec04c0b01ecf54271dad0`. An isolated consumer with package-declared `zod` and TypeScript passed public materializer/schema runtime imports and strict `CanvasState`/`materializeFromText` typing. All eight shared JSONL fixtures passed their expected public validator/materializer behavior; v1 defaults to `scroll.axis = both`, and unknown-required returns `incompatible_required_event`.
- A second isolated npm install of the Hypercanvas and tiny-canvas tarballs resolved all 55 provider-declared dependencies (354 packages in the consumer fixture). `--ignore-scripts` was passed. Its Vite production build passed and a jsdom render exercised the reference widgets, emitted local image URL, explicit JSX companions, malformed input, and unknown-required fail-closed behavior. A strict TypeScript consumer importing `virtual:tiny-canvas-documents` and `CanvasDocumentProps` passed. No workspace `node_modules` symlink was present. This did not run real Playwright browser interactions or native UI acceptance; the Playwright browser download timed out.
- No npm package was published. The current local tiny-canvas candidate tarball is `/tmp/tiny-canvas-local-artifact-r5/dfosco-tiny-canvas-5.5.0.tgz`, SHA-256 `55e16baecef6b62a2e0ecf8b607a27f6587552c32f29f27843cb2e9512ab1fc8`. Rebuild and bind the tarball to the final commit if source changes after this plan revision.
