# @dfosco/tiny-canvas

## 5.5.0

### Minor Changes

- Add `Slides` as a first-class package surface with ordered cursor and click
  steps, controlled or uncontrolled navigation, keyboard shortcuts,
  conclusions, stateful iframe URLs, scroll preservation, and themeable neutral
  panel styles.
- Add `Frame` element targeting and vertical offsets for aligning same-origin
  iframe content after load.
- Add the `tiny-canvas-snap` CLI for light and dark frame snapshots with static
  JSX validation, stateful URL preservation, target scrolling, deterministic
  output, and source prop updates.
- Add a Statefully-backed demo for exact shareable screen URLs.

### Patch Changes

- Complete Frame refresh, deep-link, dormant-poster capture, and loaded
  same-origin iframe viewport capture behavior.
- Restore frame navigation observers and scroll animations during reload and
  unmount cleanup.

## 5.4.3

### Patch Changes

- Restore loaded-frame screenshots by using browser-native DOM rasterization
  that supports modern CSS.

## 5.4.2

### Patch Changes

- Show a bottom-center viewport toast after a Frame screenshot is copied.

## 5.4.1

### Patch Changes

- Capture the same-origin iframe viewport directly without browser chrome,
  keep the capture action available for copying a dormant Frame thumbnail, and
  add copied board links that focus their addressed Frame.

## 5.4.0

### Minor Changes

- Add Frame header actions to reload the embedded page and capture the visible
  iframe to the clipboard through the browser's current-tab capture flow.

## 5.3.0

### Minor Changes

- Add an alt-hover alternative to the interaction guard: holding **Alt**
  while hovering a snapshot-backed Frame's guard swaps the **Click to
  interact** button to **Copy to clipboard**, letting users copy the
  snapshot image instead of activating the frame. The button briefly shows
  **Copied!** after a successful copy, reverting on mouse leave.

## 5.2.2

### Patch Changes

- Support native light and dark snapshot posters with an optional
  `snapshotDark` source.

## 5.2.1

### Patch Changes

- Make the entire interaction guard clickable, reveal the interaction
  affordance only on hover or keyboard focus, use a black button, and default
  its label to **Click to interact**.

## 5.2.0

### Minor Changes

- Add native snapshot-gated Frames that start with no iframe or route request,
  mount on explicit interaction, and preserve the live iframe when guarded
  again.
- Add configurable eager loading per Frame or through `widgets.Frame`
  defaults, with snapshots acting as loading posters.

## 5.1.0

### Minor Changes

- Generate kebab-case page URLs from Canvas filenames and expose the shared
  filename slug helper.
- Preserve the current hash-route query, including URL state, when switching
  between Canvas pages.

## 5.0.1

### Patch Changes

- Keep the multi-page Canvas selector below inherited prototype toolbar chrome
  while exposing a custom property for overriding its top inset.

## 5.0.0

### Major Changes

- Continue the current Block-based Tiny Canvas API above the legacy `4.x`
  release line so wildcard and semver-aware package updates resolve the
  supported package instead of the retired Draggable API.

## 0.16.3

### Patch Changes

- Republish the hash-routed Canvas page selector fix under a new patch
  version.

## 0.16.2

### Patch Changes

- Support hash-routed Canvas page selectors and preserve hash routes when
  navigating between pages.

## 0.16.1

### Patch Changes

- Fix sticky note text contrast in dark mode.

## 0.16.0

### Minor Changes

- Add a resizable `Image` widget with natural aspect-ratio locking, persisted
  dimensions, rounded corners, and configurable widget defaults.
- Add optional Frame descriptions and silently hide `urlstate` and `state.*`
  query parameters from Frame chrome while preserving navigation state.
- Lower the minimum Canvas zoom from 50% to 10%.

## 0.15.0

### Minor Changes

- Add optional `external` flags to Frame affix entries. `external: false`
  keeps an affix in the iframe URL while removing it from **Open in new tab**.
- Treat both `?query` and `/?query` append values as query parameters instead
  of encoding them into the pathname.

## 0.14.0

### Minor Changes

- Separate Canvas page filesystem discovery (`pagesPath`) from browser routing
  (`routeBase` and `resolveRoute`) and expose discovered lazy modules through
  `virtual:tiny-canvas-pages` for integration with any host router.
- Change Frame `prepend` and corrected `append` affixes to ordered arrays, with
  optional `dev`/`prod` environment targeting. Keep `apend` as a deprecated
  runtime alias.
- Treat leading-question-mark append entries as query parameters instead of
  encoding them into the pathname as `%3F`.
- Keep Frame, Note, and Mark resizing accurate at non-default Canvas zoom.

## 0.13.0

### Minor Changes

- Shield every Frame iframe with an invisible interaction layer while a Frame
  is being dragged so pointer release reaches the canvas and reliably ends the
  drag, even when released over another Frame.

## 0.12.0

### Minor Changes

- Anchor Ctrl/⌘+wheel and trackpad-pinch zoom at the cursor while keeping zoom
  buttons anchored at the viewport center.
- Make Link a fixed-size draggable card without resize controls or persisted
  size changes.

## 0.11.0

### Minor Changes

- Change the default Frame size to 1270×776.
- Give Canvas a 10,000×10,000 scrollable board by default so users can move
  beyond existing widgets.
- Add `canvasWidth` and `canvasHeight` props for overriding the board extent.

## 0.10.0

### Minor Changes

- Add bottom-left Canvas zoom controls from 50% to 200%.
- Keep Frame title and displayed route synchronized with same-origin iframe
  navigation.
- Add a Frame chrome button that opens the current URL in a new tab without
  `embedView`.

## 0.9.0

### Minor Changes

- Make Canvas a dynamic-viewport scroll container so its background always
  covers desktop and mobile viewports.
- Disable vertical overscroll and mobile pull-to-refresh while Canvas is
  mounted.

## 0.8.0

### Minor Changes

- Add optional per-widget defaults through the Vite `widgets` config. Component
  props override configured defaults.
- Add `prepend` and `apend` Frame pathname affixes with independently
  configurable route-label visibility.

## 0.7.0

### Minor Changes

- Add filesystem-driven multi-page canvases. The new Vite plugin discovers
  independent TSX Canvas routes under `src/pages/canvas` by default, supports a
  configurable route directory, and injects a sibling page selector.
- Scope persisted layout by page and component ID, and add a `Canvas` `title`
  prop that overrides the filename-derived selector label.

## 0.6.0

### Minor Changes

- Add a draggable, resizable `Link` component with explicit title/display URL,
  automatic origin favicon loading, and a built-in fallback icon.

## 0.5.0

### Minor Changes

- Add resizable, persistent `Note` sticky notes and `Mark` Markdown blocks.
- Move Canvas controls to the bottom-left and add **Copy changes**, which copies
  current-board position and size changes as agent-readable JSON.
- Share resize behavior across `Frame`, `Note`, and `Mark`, and restore Frame's
  default minimum dimensions.

## 0.4.0

### Minor Changes

- 10097be: Fix Frame route resolution, move resize handle outside iframe, and add test suite.

  **Frame route fix:** `Frame` now accepts any same-origin route — relative paths, query strings with hash routes (e.g. `/?urlstate=board#/canvas`), full same-origin URLs, and bare hash routes (`#/view`) — and correctly builds the embedded `src` by resolving `route` against the current page origin. Cross-origin routes throw a `TypeError`. Previously, non-hash routes were incorrectly embedded as a hash fragment, producing a broken iframe URL.

  The `route` prop type is widened from `` `#/${string}` `` to `string | URL`.

  **Resize handle:** The resize handle button is now rendered outside the `<iframe>` element at the bottom-right corner of the Frame block, making it accessible and interactive regardless of iframe pointer-event capture.

  Also adds Vitest as the test runner with tests for `buildFrameHref` (11 cases) and `useResetCanvas` (5 cases).

## 0.3.0

### Minor Changes

- 5bbec33: Add persistent Frame resizing, non-negative dragging, and an optional Canvas reset button.

## 0.2.0

### Minor Changes

- Add a draggable `Frame` component for same-origin route previews and make `Block` own its default panel presentation.

## 0.1.0

### Initial release

- Add `Canvas` as the strict board container for authorized canvas components.
- Add `Block` with `x` and `y` placement, dragging, persisted positions, and
  selection state.
- Add generated block identities so explicit IDs are optional.
- Add dotted backgrounds, light and dark color modes, and customizable styles.
- Add `useResetCanvas` for clearing persisted positions.
