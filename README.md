# Tiny Canvas

Reusable React surfaces for arranging interface work and presenting it. `Canvas`
provides draggable boards with persistent layout; `Slides` presents exact
stateful screens through ordered cursor and click steps.

[View the live demo](https://dfosco.github.io/tiny-canvas/)

## Install

```bash
npm install @dfosco/tiny-canvas
```

## Quick start

```jsx
import { Block, Canvas, Slides } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'

export function Board() {
  return (
    <Canvas dotted>
      <Block x={48} y={48}>
        Project summary
      </Block>

      <Block x={360} y={180}>
        Release checklist
      </Block>
    </Canvas>
  )
}
```

`Canvas` only accepts authorized canvas components. Use `Block` for arbitrary
content and `Frame` for same-origin route previews; passing a plain element
produces a clear runtime error.

`Slides` is a separate top-level surface, not a Canvas widget:

```jsx
<Slides
  deck={{
    id: 'review',
    slides: [
      {
        title: 'Details',
        description: 'Open a shareable Statefully state.',
        url: '/stateful#view=details',
      },
    ],
  }}
/>
```

## How it works

- **No explicit IDs required.** `Canvas` tags each `Block` with a generated
  persistence ID.
- **Position with props.** Set initial placement directly with `x` and `y`.
- **Persistent layout.** Dragged coordinates and resized frame dimensions are
  restored from localStorage and take precedence over initial props.
- **Room to move.** Canvas provides a 10,000×10,000 scrollable board by default.
- **Built-in zoom.** Bottom-left controls zoom around viewport center;
  Ctrl/⌘+wheel and trackpad pinch zoom around cursor.
- **Built-in selection.** Clicking or focusing a block selects it. Clicking the
  canvas background or pressing Escape clears selection.
- **Same-origin previews.** `Frame` accepts relative paths, query strings,
  hash routes, or same-origin absolute URLs and adds `embedView=1`.
- **Exact presentations.** `Slides` preserves complete stateful URLs and
  supports ordered cursor/click steps with shareable host routing.
- **Targeted snapshots.** `Frame` element/offset props and
  `tiny-canvas-snap` align live and generated views to the same content.
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

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `Block \| Frame \| Array<Block \| Frame>` | — | Authorized canvas children. Plain elements are rejected. |
| `canvasWidth` | `number` | `10000` | Scrollable board width in pixels. |
| `canvasHeight` | `number` | `10000` | Scrollable board height in pixels. |
| `dotted` | `boolean` | `false` | Show the dotted canvas background. |
| `grid` | `boolean` | `false` | Legacy alias that also enables the dotted background. |
| `gridSize` | `number` | `36` | Dot-grid spacing in pixels. |
| `colorMode` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Canvas color-scheme behavior. |
| `resettable` | `boolean` | `false` | Show a built-in **Reset board** button that clears saved layout state and reloads. |
| `resetLabel` | `ReactNode` | `'Reset board'` | Customize the reset button content. |
| `onSelectionChange` | `(blockId: string \| null) => void` | — | Observe selected block identity. |

Standard `<main>` attributes are forwarded to the canvas.

### `Block`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Content owned by the block. |
| `x` | `number` | `0` | Initial horizontal position in pixels. |
| `y` | `number` | `0` | Initial vertical position in pixels. |
| `id` | `string` | generated | Optional explicit DOM and persistence identifier. |
| `selected` | `boolean` | managed by `Canvas` | Control selected state. |
| `onPositionChange` | `({ x, y }) => void` | — | Observe drag position updates. |
| `onSelectionChange` | `(selected: boolean) => void` | — | Observe selection updates. |

Standard `<article>` attributes are forwarded to the block.

### `Frame`

`Frame` is a draggable canvas item for previewing another same-origin URL from
the current application:

```jsx
<Canvas>
  <Frame
    route="/?urlstate=security#/orgs/cli/security"
    title="Security overview"
    x={48}
    y={48}
    width={1270}
    height={776}
  />
</Canvas>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `route` | `string \| URL` | — | Same-origin URL, path, query, or hash route loaded by the iframe. |
| `title` | `string` | — | Initial accessible iframe title. Same-origin navigation updates it from the loaded document title. |
| `width` | `number` | `1270` | Initial width in pixels. Saved width takes precedence. |
| `height` | `number` | `776` | Initial height in pixels. Saved height takes precedence. |
| `minWidth` | `number` | `320` | Minimum width while resizing. |
| `minHeight` | `number` | `240` | Minimum height while resizing. |
| `onSizeChange` | `({ width, height }) => void` | — | Observe live resize updates. |
| `x`, `y`, selection, and position props | `BlockProps` | — | Frame movement and selection use the same contract as `Block`. |

Select a frame, then drag its lower-right handle or use the handle's arrow keys
to resize it. The embedded application can use the `embedView` query parameter
to suppress redirects or chrome that should not appear inside the preview. The
header follows same-origin navigation and links the current URL in a new tab.

### `useResetCanvas`

Clear all persisted block positions and frame sizes:

```jsx
import { useResetCanvas } from '@dfosco/tiny-canvas'

function ResetButton() {
  const resetCanvas = useResetCanvas({ reload: true })
  return <button onClick={resetCanvas}>Reset layout</button>
}
```

The `reload` option defaults to `false`.

## Styling

Import the package stylesheet once:

```js
import '@dfosco/tiny-canvas/style.css'
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
  --tc-frame-title-bg: #f6f8fa;
  --tc-grid-size: 36px;
}
```

`Block` owns its panel layout, background, border, spacing, and minimum width.
Primer design tokens are used automatically when available.

## Development

This repository is an npm workspace:

```text
packages/tiny-canvas/   npm package
demo/                   live demo
```

```bash
npm install
npm run build
npm run build:demo
npm run dev
```

## License

[MIT](packages/tiny-canvas/LICENSE)
