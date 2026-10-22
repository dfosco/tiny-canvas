# Ordinary repository: Chrome Components

This is an independent Vite app that includes the actual Button Patterns canvas and the actual Hyperbase Chrome Components canvas with its Chrome Overview prototype. It demonstrates the existing JSONL consumer API in a regular repository. The canonical Button Patterns route renders its supported notes and Markdown while diagnosing the missing JSX companions and unresolved SiloDashboard prototype dependencies. Chrome Overview supplies the complete real source/HMR/Frame journey. The document file, image asset, canvas widget IDs, prototype source and recursively imported local components/styles are source inputs. The dev server reads the canvas; it never writes it. Drag and resize state stays in this browser's `localStorage`.

## Install and run

Use Node 20 or newer and npm 10 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite at `/canvas/button-patterns` to inspect the canonical canvas and its explicit missing-source diagnostics, or `/canvas/chrome-components` for the complete runnable reference. The Chrome Overview Frame loads the real local React page. **Explore page details** changes its inner route to `?view=details#overview`. The canvas selector and frame continue to use the stable source IDs.

Build a portable static app at the root or a branch/subpath base:

```sh
npm run build
BASE_URL=/branch--demo/ npm run build
```

Vite's `BASE_URL` is the deployment prefix. The same static output can be served beneath `/branch--demo/` by a normal static host that supports SPA fallback.

## Edit the prototype

Edit `src/hyperbase/prototypes/chrome-overview/index.jsx`. Vite HMR updates the open same-origin Frame. Edit `src/hyperbase/canvas/chrome-components.canvas.jsonl` to change canvas content or source geometry. The loader treats these files as read-only inputs. The generated `dist/` directory is build output; edit source files and rerun `npm run build` instead of editing generated output.

The copied source tree retains the reference page's local components and stylesheet. Its `#hyperbase/...` monorepo import-map specifiers were rewritten as relative imports so this app has no private resolver. The Hypercanvas root-barrel Icon import was reduced to its exact static mascot SVG path because that barrel exposes the Hypercanvas application/workspace UI. No application API, host data hook or server behavior is used.

The 31-file local closure includes ChromeDialogs, ChromeMenus, ChromePanels, ChromeSidebar, ChromeTopbar, their CSS modules, the imported `components/ui` primitives, `hooks/use-mobile.js`, `lib/utils.js`, the prototype, and `styles/shadcn.css`. The app's declared external closure is React/React DOM, React Router, Base UI, Lucide, class-variance-authority, clsx, tailwind-merge, Tailwind, tw-animate-css, the shadcn stylesheet package, the Vite React/Tailwind plugins, Tiny Canvas, and Hypercanvas's public materializer. Chrome Overview uses local React state and URL navigation; it has no flow/object data imports or remote Site.

## Public package artifacts

`vendor/` contains only exact prerelease package archives used for this reproducible proof. They are ordinary npm `file:` dependencies, not workstation paths or links. Installations resolve the declared dependency graph from the archives and npm. This repository does not publish them.

| Package | Source basis | SHA-256 |
| --- | --- | --- |
| `@dfosco/hypercanvas@0.70.0-beta.0` | accepted provider commit `498d5d03defaf2cb8b0a8a896d6e6f63276c6e77` | `f2d9d9da5b348bb88d432d42aedbd357ad9db26d61242dac27cddee4ac04eada` |
| `@dfosco/tiny-canvas@5.5.0` | accepted tiny-canvas base `c58e35db08c2c0ec7b452382b31b402cefb90ec1` | `60ee26159a26b2281ab1b60e367de948c1ad14c9d130d64cd902395d6d88c5d0` |

Hypercanvas is used through `@dfosco/hypercanvas/canvas/materializer` as the renderer's documented public dependency. The selected import chain is browser-neutral (`materializer` → `canvasEvents` → `zod`); it does not call the Hypercanvas app, Core server or Paseo. This sample has no dependency on the Hypercanvas root export.

## Reference limits

The Chrome Components source includes Markdown, a local image, a same-origin prototype, component-set records, story records, and historical agent records. Tiny Canvas renders Markdown, the image, and the prototype with their original IDs. It displays explicit diagnostics for component-set and story capabilities it does not implement. Those records are not silently removed or shown as rendered. The separate canonical Button Patterns source retains its sticky-note/Markdown IDs and `/Example?flow=Example%2Fdefault` route; the consumer emits `missing_jsx_companion` for its `PrimaryButtons` and `DangerButtons` source entries and the diagnostic route identifies the missing SiloDashboard chart and flow/object data.

The Button Patterns data also remains covered by the original shared fixture. Its real `/Example?flow=Example%2Fdefault` route points to SiloDashboard, whose chart import and flow/object data are not present in the available reference checkout. The `PrimaryButtons` and `DangerButtons` JSX exports are absent. This sample does not substitute an invented button demo or pretend source exports are serialized data. Reproducing that route requires the missing source/data inputs.

This reference has no out-of-process Site, Frame poster, or production link. Where a future reference depends on an external Site, provide an explicit poster and production link rather than making the local canvas depend on a host-only server.
