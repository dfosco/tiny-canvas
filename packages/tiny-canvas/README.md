# Tiny Canvas

A small React canvas for arranging interactive blocks. Tiny Canvas gives every
block a stable generated identity, persists dragged positions and sizes in
localStorage, and can copy layout changes as agent-readable JSON.

[View the live demo](https://dfosco.github.io/tiny-canvas/)

## Install

```bash
npm install @dfosco/tiny-canvas
```

## Quick start

```jsx
import { Block, Canvas, Image, Link, Mark, Note } from "@dfosco/tiny-canvas";
import "@dfosco/tiny-canvas/style.css";

export function Board() {
  return (
    <Canvas title="Project board" dotted resettable>
      <Block x={48} y={48}>
        Project summary
      </Block>

      <Block x={360} y={180}>
        Release checklist
      </Block>

      <Note x={48} y={240} color="yellow">
        {"## Remember\nShip the smallest useful thing."}
      </Note>

      <Mark x={400} y={320}>
        {"### Status\n\n- Built\n- Tested"}
      </Mark>

      <Link
        url="https://github.com/dfosco/tiny-canvas"
        title="Tiny Canvas"
        displayUrl="github.com/dfosco/tiny-canvas"
        x={400}
        y={480}
      />

      <Image src="/reference.png" alt="Reference screen" x={760} y={240} />
    </Canvas>
  );
}
```

Tiny Canvas also exports `Slides` as a parallel presentation surface:

```jsx
import { Slides } from "@dfosco/tiny-canvas";

const deck = {
  id: "review",
  title: "Design review",
  slides: [
    {
      title: "Open details",
      description: "Restore an exact Statefully screen.",
      url: "/prototype#view=overview",
      steps: [
        { type: "cursor", targetId: "view-toggle", scrollOffset: -16 },
        { type: "click", url: "/prototype#view=details" },
      ],
    },
  ],
};

export function Review() {
  return <Slides deck={deck} />;
}
```

## Multiple canvas pages

Each TSX route file owns one independent `<Canvas>`. The Vite plugin discovers
sibling files and adds a Storyboard-style page selector to every canvas in the
configured directory.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tinyCanvas from "@dfosco/tiny-canvas/vite";

export default defineConfig({
  plugins: [
    react(),
    tinyCanvas({
      routeBase: "/canvas",
      widgets: {
        Frame: {
          prepend: [
            { value: "/dev-proxy", visible: false, env: "dev" },
            { value: "/previews/branch", visible: false, env: "prod" },
          ],
          append: [
            { value: "/embedded", visible: true },
            {
              value: "/?hideTooling=1",
              external: false,
              visible: false,
              env: "dev",
            },
          ],
        },
        Note: { color: "blue" },
      },
    }),
  ],
});
```

`widgets` optionally supplies default props for `Block`, `Frame`, `Note`,
`Mark`, and `Link`. Defaults are JSON-serializable and apply to every instance;
props written directly on a component take precedence. Identity and content
props (`id`, `blockId`, and `children`) are never inherited from widget config.

`routeBase` defaults to `/canvas`; `pagesPath` defaults to the matching
`src/pages/canvas` directory. For example:

```text
src/pages/canvas/index.tsx        → /canvas
src/pages/canvas/details.tsx      → /canvas/details
src/pages/canvas/SecondPage.tsx   → /canvas/second-page
src/pages/canvas/review/index.tsx → /canvas/review
```

Each file renders its own Canvas:

```tsx
// src/pages/canvas/details.tsx
import { Canvas, Note } from "@dfosco/tiny-canvas";

export default function DetailsPage() {
  return (
    <Canvas title="Details" dotted resettable>
      <Note x={48} y={72}>
        Details page
      </Note>
    </Canvas>
  );
}
```

For routers that use another filesystem convention, configure discovery and URL
routing separately. `resolveRoute` can map each discovered file to the route
actually registered by the host router:

```ts
tinyCanvas({
  pagesPath: "src/routes/tiny-board",
  routeBase: "/tiny-board",
  resolveRoute: ({ relativePath, defaultRoute }) => {
    if (relativePath === "TinyBoardPage.tsx") return "/tiny-board";
    if (relativePath === "TinyBoardPage2.tsx") return "/tiny-board/second";
    return defaultRoute;
  },
  titles: {
    "/tiny-board": "Overview",
    "/tiny-board/second": "Review",
  },
});
```

Only static `.tsx` files containing a `<Canvas>` are discovered; route
definition files, dynamic route files, tests, and specs are skipped. A static
`title` prop on `Canvas` overrides the filename in the selector. Plugin
`titles` overrides take highest priority. `pagesDir` remains as a deprecated
alias for `routeBase`. Filename stems are converted to kebab-case URL segments;
for example, `ReleaseReview.tsx` maps to `/canvas/release-review`. Hash-router
page links retain the current hash query so URL-backed state survives page
navigation.

The router-agnostic virtual registry exposes the same discovered pages as lazy
module loaders. Use it when constructing routes for React Router, TanStack
Router, or another host router:

```ts
import pages from "virtual:tiny-canvas-pages";

// [{ id, title, href, load: () => import(pageFile) }]
```

Tiny Canvas does not mutate the host router. Each registry route must still be
registered by that router.

`Canvas` only accepts authorized canvas components. Use `Block` for arbitrary
content, `Frame` for same-origin route previews, `Note` for sticky notes,
`Mark` for Markdown, and `Link` for favicon-backed link cards. Passing a plain
element produces a clear runtime error.

## How it works

- **No explicit IDs required.** `Canvas` tags each `Block` with a generated
  persistence ID.
- **Position with props.** Set initial placement directly with `x` and `y`.
- **Persistent layout.** Dragged coordinates and resized dimensions are scoped
  by page and component ID in localStorage, then restored ahead of initial props.
- **Viewport-owned board.** Canvas fills the dynamic viewport, owns board
  scrolling, and disables mobile pull-to-refresh.
- **Room to move.** Canvas provides a 10,000×10,000 scrollable board by default.
- **Built-in zoom.** Bottom-left controls scale board content from 10% to 200%
  around the viewport center. Ctrl/⌘+wheel and trackpad pinch zoom around the
  cursor.
- **Agent handoff.** **Copy changes** copies changed coordinates and sizes as
  JSON with component, key/index, and persistence identity.
- **Built-in selection.** Clicking or focusing a block selects it. Clicking the
  canvas background or pressing Escape clears selection.
- **Same-origin previews.** `Frame` accepts relative paths, query strings,
  hash routes, or same-origin absolute URLs and adds `embedView=1`.
- **Stable across content edits.** Generated IDs use a React key when supplied,
  otherwise the block structure and sibling position.

Use a React `key` when blocks can be reordered and their persisted positions
must follow them:

```jsx
<Canvas>
  {cards.map((card) => (
    <Block key={card.slug} x={card.x} y={card.y}>
      <Card {...card} />
    </Block>
  ))}
</Canvas>
```

An optional `id` can still be supplied when an application needs a specific DOM
and persistence identifier, but it is not required.

## API

### `Canvas`

| Prop                | Type                                                 | Default               | Description                                                                        |
| ------------------- | ---------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `children`          | `Block \| Frame \| Note \| Mark \| Link \| Array<…>` | —                     | Authorized canvas children. Plain elements are rejected.                           |
| `title`             | `string`                                             | filename              | Override the page selector label.                                                  |
| `canvasWidth`       | `number`                                             | `10000`               | Scrollable board width in pixels.                                                  |
| `canvasHeight`      | `number`                                             | `10000`               | Scrollable board height in pixels.                                                 |
| `dotted`            | `boolean`                                            | `false`               | Show the dotted canvas background.                                                 |
| `grid`              | `boolean`                                            | `false`               | Legacy alias that also enables the dotted background.                              |
| `gridSize`          | `number`                                             | `36`                  | Dot-grid spacing in pixels.                                                        |
| `colorMode`         | `'auto' \| 'light' \| 'dark'`                        | `'auto'`              | Canvas color-scheme behavior.                                                      |
| `resettable`        | `boolean`                                            | `false`               | Show a built-in **Reset board** button that clears saved layout state and reloads. |
| `resetLabel`        | `ReactNode`                                          | `'Reset board'`       | Customize the reset button content.                                                |
| `copyable`          | `boolean`                                            | value of `resettable` | Show a built-in **Copy changes** button.                                           |
| `copyLabel`         | `ReactNode`                                          | `'Copy changes'`      | Customize the copy button content.                                                 |
| `copiedLabel`       | `ReactNode`                                          | `'Copied'`            | Customize the temporary success content.                                           |
| `onCopyChanges`     | `(changes, text) => void`                            | —                     | Observe a successful clipboard copy.                                               |
| `onSelectionChange` | `(blockId: string \| null) => void`                  | —                     | Observe selected block identity.                                                   |

Standard `<main>` attributes are forwarded to the canvas.
When the Vite page plugin discovers two or more sibling TSX pages, Canvas also
shows the built-in page selector automatically. Zoom controls are always shown
in the bottom-left corner.

### `Block`

| Prop                | Type                          | Default             | Description                                       |
| ------------------- | ----------------------------- | ------------------- | ------------------------------------------------- |
| `children`          | `ReactNode`                   | —                   | Content owned by the block.                       |
| `x`                 | `number`                      | `0`                 | Initial horizontal position in pixels.            |
| `y`                 | `number`                      | `0`                 | Initial vertical position in pixels.              |
| `id`                | `string`                      | generated           | Optional explicit DOM and persistence identifier. |
| `selected`          | `boolean`                     | managed by `Canvas` | Control selected state.                           |
| `onPositionChange`  | `({ x, y }) => void`          | —                   | Observe drag position updates.                    |
| `onSelectionChange` | `(selected: boolean) => void` | —                   | Observe selection updates.                        |

Standard `<article>` attributes are forwarded to the block.

### `Frame`

`Frame` is a draggable canvas item for previewing another same-origin URL from
the current application:

```jsx
<Canvas>
  <Frame
    route="/?urlstate=security#/orgs/cli/security"
    title="Security overview"
    description="Unread comment inbox"
    prepend={[
      { value: "/dev-proxy", visible: false, env: "dev" },
      { value: "/previews/branch", visible: false, env: "prod" },
    ]}
    append={[
      { value: "/embedded", visible: true },
      {
        value: "/?hideTooling=1",
        external: false,
        visible: false,
        env: "dev",
      },
    ]}
    x={48}
    y={48}
    width={1270}
    height={776}
  />
</Canvas>
```

| Prop                                    | Type                                    | Default               | Description                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `route`                                 | `string \| URL`                         | —                     | Same-origin URL, path, query, or hash route loaded by the iframe.                                                                                                              |
| `title`                                 | `string`                                | —                     | Initial accessible iframe title and header label. Same-origin navigation replaces it with the loaded document title.                                                           |
| `description`                           | `string`                                | —                     | Optional state description shown beside the title in smaller type.                                                                                                             |
| `loadStrategy`                          | `'eager' \| 'interaction'`              | inferred              | Mount immediately with `eager`, or require explicit activation with `interaction`. Defaults to `interaction` when `snapshot` is set and `eager` otherwise.                     |
| `snapshot`                              | `string`                                | —                     | Browser-resolvable preview image. Required for `interaction`; used as a loading poster with `eager`.                                                                           |
| `snapshotDark`                          | `string`                                | —                     | Optional dark-mode preview selected by the native `<picture>` element.                                                                                                         |
| `interactLabel`                         | `ReactNode`                             | `'Click to interact'` | Visible interaction-gate button content. Its accessible name also includes the Frame title.                                                                                    |
| `element`                               | `string`                                | —                     | ID of a same-origin element to reveal after the iframe first loads.                                                                                                            |
| `offset`                                | `number`                                | `0`                   | Additional vertical scroll offset. Positive values scroll farther down; negative values retain more context above the target.                                                  |
| `prepend`                               | `{ value, visible, env? }[]`            | —                     | Add ordered entries before the URL pathname.                                                                                                                                   |
| `append`                                | `{ value, visible, external?, env? }[]` | —                     | Add ordered entries after the URL pathname. A leading `?` or `/?` adds query parameters without pathname encoding. `external: false` omits the entry from **Open in new tab**. |
| `apend`                                 | object or array                         | —                     | Deprecated runtime alias for `append`.                                                                                                                                         |
| `width`                                 | `number`                                | `1270`                | Initial width in pixels. Saved width takes precedence.                                                                                                                         |
| `height`                                | `number`                                | `776`                 | Initial height in pixels. Saved height takes precedence.                                                                                                                       |
| `minWidth`                              | `number`                                | `320`                 | Minimum width while resizing.                                                                                                                                                  |
| `minHeight`                             | `number`                                | `240`                 | Minimum height while resizing.                                                                                                                                                 |
| `onSizeChange`                          | `({ width, height }) => void`           | —                     | Observe live resize updates.                                                                                                                                                   |
| `x`, `y`, selection, and position props | `BlockProps`                            | —                     | Frame movement and selection use the same contract as `Block`.                                                                                                                 |

Select a frame, then drag its lower-right handle or use the handle's arrow keys
to resize it. The embedded application can use the `embedView` query parameter
to suppress redirects or chrome that should not appear inside the preview.
Affixes without `env` apply everywhere. `env: 'dev'` applies during Vite serve;
`env: 'prod'` applies during production builds. Their `visible` flags only
control whether each value appears in the route text shown in the title bar.
`external` defaults to `true`; set it to `false` to keep an affix in the iframe
URL while removing it from the Frame's external URL.
Environment targeting uses the manifest injected by the Tiny Canvas Vite
plugin; without that plugin, Frame defaults to `prod`.
The title bar follows same-origin iframe navigation and includes an **Open in
new tab** link for the current URL, with `embedView` removed.
URL-state query parameters (`urlstate` and `state.*`) stay active in the iframe
and external link, but are silently omitted from the route shown in the title
bar. Use `description` to label the represented screen state.

Frames remain eager by default for backwards compatibility. Supplying a
snapshot without a strategy creates a snapshot gate: Tiny Canvas renders no
iframe element or request until the user activates that Frame. The full
viewport guard is the click target; its black **Click to interact** button and
subtle overlay appear on hover or keyboard focus. Once mounted, the iframe
stays live for the page session; ending interaction restores the guard without
discarding its URL, state, or scroll position.
When both `snapshot` and `snapshotDark` are supplied, the poster uses a native
`<picture>` element with a `prefers-color-scheme: dark` source, so the browser
selects the appropriate image without JavaScript theme detection.
Holding **Alt** while hovering a snapshot-backed guard swaps the button to
**Copy to clipboard**; clicking it copies the snapshot image to the user's
clipboard instead of activating the Frame, briefly confirming with
**Copied!** before reverting once the pointer leaves the guard.
The Frame header also provides refresh, copied deep-link, and capture actions.
Dormant Frames copy their visible poster. Loaded same-origin Frames capture the
current iframe viewport, including its current URL state and scroll position.
Cross-origin live DOM capture is blocked by browser security.

When `element` is set, Frame finds that ID after the iframe loads and performs
a 900ms eased scroll with 24px of top context plus `offset`. The scroll runs
once per mounted iframe, including after an interaction-gated Frame is first
activated.

```jsx
import settingsSnapshot from "./settings.png";

<Frame route="/settings" title="Settings" snapshot={settingsSnapshot} />;
```

Choose eager loading explicitly per Frame with `loadStrategy="eager"`, or for
every Frame through the existing Vite widget defaults:

```js
tinyCanvas({
  widgets: {
    Frame: {
      loadStrategy: "eager",
    },
  },
});
```

### `Slides`

`Slides` is a top-level surface beside `Canvas`; it is not a Canvas child. It
accepts a deck with base slide URLs and ordered intermediary steps:

```js
{
  id: "review",
  title: "Design review",
  conclusion: "Finished.",
  slides: [
    {
      title: "Review settings",
      description: "Explain the exact state.",
      url: "/prototype#view=overview",
      displayUrl: "example.test/prototype",
      steps: [
        { type: "cursor", targetId: "settings", scrollOffset: -24 },
        { type: "click", url: "/prototype#view=details&panel=open" },
      ],
      framePaddingPercent: 5,
    },
  ],
}
```

`Slides` owns the base -> ordered steps -> next-slide state machine. Click
steps replace the URL inside the mounted same-origin iframe and preserve its
scroll position. Cursor steps use the same target and offset behavior as
`Frame`. `Command+K` advances, `Command+Shift+K` skips remaining steps, and
`Command+J` returns to the previous slide base. The conclusion keeps the final
iframe mounted beneath a scrim.

Use `slideIndex`, `stepIndex`, `onSlideChange`, and `onStepChange` to integrate
with a host router. Slide indices are zero-based in component props; step
indices are one-based. The package does not prescribe a canonical route.
Statefully hashes, query parameters, and other host-owned URL state are
preserved.

Slides styles use neutral custom-property fallbacks such as `--background`,
`--foreground`, `--card`, `--muted`, `--border`, `--accent`, `--ring`, and
`--radius`. Hosts can override the corresponding `--tc-slides-*` properties
directly.

## Frame snapshots

Install Playwright in the consuming repository, then run the package CLI:

```bash
npx playwright install chromium
npx tiny-canvas-snap src/pages/canvas
```

The CLI starts the repository's `npm run dev` server unless `--base-url` is
provided. It captures light and dark images by default, preserves complete
stateful frame URLs, waits for the configured `element` and `offset`, writes
deterministic files under `public/tiny-canvas/snapshots`, and adds
`snapshot`/`snapshotDark` props to self-closing Frames.

```bash
tiny-canvas-snap src/pages/canvas/review.tsx --theme light
tiny-canvas-snap src/pages/canvas --new
tiny-canvas-snap src/pages/canvas --no-write --base-url http://127.0.0.1:5173/
```

Frame routes and capture metadata must be static JSX values or local constants.
Unsupported dynamic expressions and missing target IDs fail explicitly instead
of producing a screenshot of the wrong state.

### `Note` and `Mark`

Both components accept Markdown string children, the movement props from
`Block`, and the size props from `Frame`. Both are resizable and persist their
width and height.

```jsx
<Note color="pink" x={48} y={48} width={270} height={170}>
  {'## Review\nCheck empty and loading states.'}
</Note>

<Mark x={360} y={48} width={530}>
  {'# Release plan\n\n1. Test\n2. Publish'}
</Mark>
```

`Note` supports `yellow`, `blue`, `green`, `pink`, `purple`, and `orange`.
`Mark` also accepts Markdown through its `content` prop; `Note` accepts `text`.

### `Image`

`Image` renders a browser-resolvable image URL or imported asset without extra
chrome. It defaults to `400×300`, preserves the image's natural aspect ratio
while resizing, persists size changes, and uses 4px rounded corners.

```jsx
import referenceUrl from "./reference.png";

<Image
  src={referenceUrl}
  alt="Comment inbox — unread state"
  x={48}
  y={48}
  width={400}
  height={300}
/>;
```

`alt` defaults to an empty string for decorative images. The minimum size is
`100×60`. Use `--tc-image-radius` and `--tc-image-bg` to customize its surface.

### `Link`

`Link` renders a draggable, fixed-size link card. It loads `/favicon.ico` from
the destination origin; if that image fails, a neutral globe remains visible.
The title and displayed URL are explicit so the component never needs to fetch
cross-origin page metadata.

```jsx
<Link
  url="https://github.com/dfosco/tiny-canvas"
  title="Tiny Canvas"
  displayUrl="github.com/dfosco/tiny-canvas"
  x={48}
  y={48}
/>
```

Use `width` or `height` for a static size override. Link has no resize handle
and does not persist size changes.

### `useResetCanvas`

Clear all persisted block positions and frame sizes:

```jsx
import { useResetCanvas } from "@dfosco/tiny-canvas";

function ResetButton() {
  const resetCanvas = useResetCanvas({ reload: true });
  return <button onClick={resetCanvas}>Reset layout</button>;
}
```

The `reload` option defaults to `false`.

## Styling

Import the package stylesheet once:

```js
import "@dfosco/tiny-canvas/style.css";
```

Override CSS custom properties to fit your application:

```css
:root {
  --tc-bg-muted: #f6f8fa;
  --tc-dot-color: rgb(0 0 0 / 8%);
  --tc-selection-color: #0969da;
  --tc-border-radius: 12px;
  --tc-block-bg: #fff;
  --tc-block-border-color: rgb(0 0 0 / 15%);
  --tc-block-gap: 8px;
  --tc-block-min-width: 300px;
  --tc-block-padding: 24px;
  --tc-frame-bg: #fff;
  --tc-frame-border-color: rgb(0 0 0 / 15%);
  --tc-frame-width: 1270px;
  --tc-frame-height: 776px;
  --tc-image-radius: 4px;
  --tc-image-bg: transparent;
  --tc-frame-title-bg: #f6f8fa;
  --tc-mark-bg: #fff;
  --tc-mark-border-color: rgb(0 0 0 / 15%);
  --tc-link-bg: #fff;
  --tc-link-border-color: rgb(0 0 0 / 15%);
  --tc-grid-size: 36px;
}
```

`Block` owns its panel layout, background, border, spacing, and minimum width.
Primer design tokens are used automatically when available.
The page selector starts 16px below any inherited
`--prototype-overlay-top-inset`. Set
`--tc-canvas-pages-inset-block-start` to override its complete top inset.

## Requirements

- React 18 or 19
- React DOM 18 or 19

## License

[MIT](LICENSE)
