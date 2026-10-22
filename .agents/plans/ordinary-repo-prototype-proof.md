# Ordinary-repository prototype proof

## Goal mapping

This is the technical plan and durable proof record for tiny-canvas `#g002` and the linked Hypercanvas integration `#g162`. Canonical contract refs are tiny `#g002` r8 / t01 r2, t02 r2, t03 r2 and Hypercanvas `#g162` r7 / t01 r2, t02 r1, t03 r1. Task ordering is sequential: dependency closure, portable app/resources, then fresh consumer proof. Tiny owns this source tree and records. Hypercanvas source/record changes stay with their owners.

## Reference and boundary

Include the canonical actual `src/canvas/button-patterns.canvas.jsonl` as the starting reference. Preserve and render its supported notes/Markdown while diagnosing its missing JSX companions and unresolved `/Example` route. For the fully runnable source/HMR journey, use the actual Hyperbase `notebooks/hyperbase/canvas/chrome-components.canvas.jsonl` and `prototypes/chrome-overview/index.jsx`. It contains real Markdown, image, prototype, component-set, story and historical agent records with stable IDs. The runnable local route is `/chrome-overview`; its real React page exercises navigation, dialogs, sidebar, panels and the existing Tailwind/shadcn styles. Carry both original canvas streams, the image bytes, route, query/hash interactions and recursive local imports. Explicitly show unsupported capabilities; do not drop records or imply they render.

Button Patterns is included as the canonical starting point, not replaced or faked. The ordinary consumer renders its supported notes and Markdown, reports `missing_jsx_companion` for the absent `PrimaryButtons` and `DangerButtons` modules, and explains that `/Example?flow=Example%2Fdefault` targets SiloDashboard with a missing chart component and unresolved flow/object data imports. Chrome Overview is the smallest complete real prototype in the available checkout that can prove source-edit/HMR/browser/build without requiring Statefully host behavior or accepting D's draft API.

Chrome Overview's 31-file local closure is copied with its dialogs, menus, panels, sidebar, topbar, CSS modules, imported `components/ui` primitives, mobile hook, utility module, prototype and shadcn stylesheet. Its external imports are React/React DOM, React Router, Base UI, Lucide, class-variance-authority, clsx, tailwind-merge, Tailwind, tw-animate-css and `shadcn/tailwind.css`; the app adds the Vite React/Tailwind plugins and Tiny Canvas. JSONL playback uses only the public Hypercanvas materializer entry. Chrome Overview uses local React state and URL navigation, with no flow/object import or out-of-process Site.

## Immutable source identities

- Tiny-canvas checkout: `/Users/danielfosco/workspace/tiny-canvas`, current `main`, current source base `595d5c32866c48c320dea59ae36d4a02fadf5b0e` (including accepted source correction `c58e35db08c2c0ec7b452382b31b402cefb90ec1`).
- Hypercanvas checkout: `/Users/danielfosco/workspace/hypercanvas`, linked counterpart `#g162`; accepted provider `#g158/#g161` commit `498d5d03defaf2cb8b0a8a896d6e6f63276c6e77`. The prototype/canvas source snapshot is HC commit `3545ca695451a68f0ef458140fd202b8869643bb`. Button Patterns canvas blob: `e536094374cefb5ea590fc61fb52f47d08fa2d88`; Chrome Components canvas blob: `44e182fcd7d2190dbc699c8249adaa638099e739`; Chrome Overview source blob: `7ca463274542c0ffb153e3a5c2f2231c63612b17`; referenced image blob: `e1743ed464d3433a683914bfb8b4d898ee5a9da2`.
- Exact local packed provider and tiny-canvas archives are listed with SHA-256 in `examples/ordinary-repo-prototype/README.md`; the package JSON uses relative `file:./vendor/...` paths.

## Implementation

1. Inventory the complete recursive dependency graph and public imports of Chrome Overview. Record unsupported capabilities and the Button Patterns route gap.
2. Add an ordinary Vite consumer example containing both actual canvas JSONL documents, the exact referenced image, the Chrome Overview prototype module and all 31 recursively imported local components/styles. Adapt only import paths needed to make the copied source an ordinary independent package; preserve actual prototype behavior and file/content identities.
3. Install tiny-canvas and the accepted Hypercanvas public package from exact local tarballs using portable relative `file:` dependencies. Include hashes and artifact provenance. Use normal declared dependency installation and normal Vite dev/build commands. Do not add private registries, workspace links, HC app/Core/Paseo dependencies, server processes, or a second snapshot/capture path.
4. Exercise the real Frame and route via headless Playwright. Verify query/hash/theme/base handling, image requests, unsupported diagnostics, no private requests, source-edit HMR in the iframe, local browser override behavior when source geometry changes, and clean production output at root, a subpath, and `/branch--demo/` after moving the build directory.
5. Adapt `.github/skills/tiny-board/SKILL.md` with independent-consumer instructions and source/generated ownership guidance. Keep existing monorepo snapshot guidance intact and make commands/paths usable from a consumer checkout.

## Verification and delivery

### Results

- `npm test --workspace=packages/tiny-canvas` passed: 16 files, 103 tests. The Button Patterns document and original shared Button Patterns fixture both validate through the installed public materializer. The accepted v2 `canvas_layout_restored` fixture round-trips; missing-value and `unknown-required` fixtures fail closed. The public schema JSON export imports from the normal installed package.
- `npm ci`, `npm run check:reference`, `npm run test:browser`, `npm run test:production`, and `npm run build` passed in the sample and copied consumer. The copied checkout built with ordinary Vite commands for `/`, `/consumer-preview/`, and `/branch--demo/`; each built output was copied to another directory and served with ordinary SPA fallback.
- Direct headless Chromium verified both real canvas routes, stable IDs, explicit unsupported diagnostics, image requests, browser theme, Frame viewport, query/hash, inner prototype navigation, Vite HMR after editing real prototype JSX, local layout persistence after reload, and changed source geometry superseding its saved override. All browser requests stayed on the local origin.
- Dependencies at the accepted provider artifact path are browser-neutral `materializer.js` → `canvasEvents.js` → `zod`; `npm ls @getpaseo/cli @getpaseo/client` is empty. No Core, Paseo, app root barrel, or private resolver is imported.
- Limits: no native/visible UI acceptance, no full authoring parity for the absent Button Patterns source/data, and no out-of-process Site in this reference. Vite warns that the complete Chrome prototype bundle contains a 772 KB minified chunk. Clean npm install reports 7 high-severity advisories in the resolved dependency graph; this task did not remediate them.


## Acceptance boundary

Headless Chromium browser acceptance covers the dev/HMR/Frame and moved production-output scenarios above. No native app or visible UI acceptance is claimed. The example has no out-of-process Site, and Button Patterns' missing JSX source/data dependencies are diagnosed rather than represented as runnable. Preserve source files as owner-authored inputs; generated `dist/` output remains build-owned and must not be edited. No release or npm publication is part of this work.
