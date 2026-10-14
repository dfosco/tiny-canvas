# Plan: MDX-native Tiny Canvas + portable JSONL + canonical read-only projections

**Status:** implementation handoff / not implemented.  
**Depends on:** [Portable Canvas Contract](./portable-canvas-contract.md), the three schema files in `/schemas`, and Hypercanvas's producer/exporter implementation plan on the matching feature branch.

## Non-negotiable product model

Tiny Canvas has **two peer-level authored inputs**, not one translated into the other:

1. **MDX/TSX authoring**, unchanged. A developer hand-writes `<Canvas>`, `<Frame>`, `<Note>`, etc. and freely composes React UI. Tiny Canvas remains useful without Hypercanvas or JSONL. Its existing localStorage geometry behavior remains the default.
2. **Portable JSONL document authoring**, added. A producer first maps its private widget types to public portable types (`note`, `frame`, `agent`, `redacted`, etc.). The Tiny Canvas materializer replays that versioned event stream and renders it through the *same visual primitives*. In development, canvas gestures and agent commands can append source events instead of writing localStorage.

A **third, derived and immutable surface** is the canonical read-only presentation **regenerated from editable JSONL on every build** by Tiny Canvas, not cached as an export-time snapshot. A web publication must render all widgets, even source widgets whose live/editing implementation is unavailable. It may contain inert snapshots, transcripts, metadata cards, or explicit redaction notices. Do not serialize arbitrary JSX into JSONL or generate MDX merely to show Hypercanvas content.

## Implementation sequence

### T0 — Lock v1 schemas, package distribution and compatibility fixtures

- Maintain `/schemas/canvas-events.v1.schema.json`, `canvas-presentation.v1.schema.json`, and `canvas-publication.v1.schema.json` as the public contract. Version each independently; document `formatVersion` vs `schemaVersion`.
- Make `npm run build --workspace=packages/tiny-canvas` copy canonical root schemas into npm package assets (the first part is scaffolded in this branch). Keep the runtime build unaffected.
- Add JSON Schema meta-validation and valid/invalid fixtures, including all event families, all presentation variants, the publication catalog, unsafe paths, invalid checksums, redaction/status mismatches and duplicate widget IDs (the latter requires a cross-record validator).
- Tighten portable widget `props` into strict, typed, allowlisted contracts per canonical kind before claiming full production readiness. The initial event JSON Schema permits additional fields for event/reducer compatibility; it does **not** by itself prevent accidental private prop publication. Enforce privacy in the producer and in build validators.
- Keep event names and reducer behavior compatible with Hypercanvas v1. Generate parity fixtures from the **actual** Hypercanvas reducer for all 14 known event names; run those fixtures in Tiny Canvas CI without importing Hypercanvas.
- Establish a v1 compatibility policy: preserve unknown extension fields for round-trip when safe, surface diagnostics for unrecognized events, reject unsupported *major* format versions. A publisher must fail on events whose effects would be silently lost.

**Exit:** package tarball includes all three valid schemas, consumer can resolve paths, schema fixtures verify, and the event protocol is independently documented.

### T1 — Extract a React-free, zero-Hypercanvas materializer

Proposed `@dfosco/tiny-canvas/document` exports:

```ts
parseCanvasJsonl(text: string): ParsedCanvasStream
validateCanvasStream(events: readonly unknown[]): ValidationResult
materializeCanvasEvents(events: readonly CanvasEvent[]): PortableCanvasState
applyCanvasEvent(state: PortableCanvasState, event: CanvasEvent): PortableCanvasState
serializeCanvasEvent(event: CanvasEvent): string
compileReadOnlyPresentation(state: PortableCanvasState, options: PublicAssetContext): CanvasPresentation
validateCanvasPresentation(presentation: unknown): ValidationResult
validatePublicationInventory(manifest: unknown): ValidationResult
```

- Adopt the upstream Hypercanvas reducer's semantics for initial state, props patches, move/remove, compaction/replacement, settings, sources, connectors, waypoints, and undo/redo-as-forward-events. Test equality for the same event sequence and recovery from corrupted lines.
- **No React, Vite, Node filesystem APIs, Hypercanvas private code, or server dependency** in this subpath. Browser, Node, and worker consumers can call it directly.
- Define reliable error policy: a malformed JSONL line must be reported with its line/offset, not silently transformed into a partially correct published board.
- Define stable IDs across compaction, HMR, page rename, connector links and export/import. Portable event records use normalized Tiny Canvas widget types; only their reducer mechanics match raw Hypercanvas events. Never derive document widget IDs from React array indices.
- Reserve default widget geometry and origin normalization logic in the projection/renderer adapters; do not accidentally overwrite signed coordinates.

**Exit:** identical materialized state and validation results for shared reducer fixtures, including all connectors and undo/redo operations.

### T2 — React adapters without weakening the MDX API

Proposed public components:

```tsx
// Original API remains supported without JSONL
<Canvas title="My board"><Note id="one" x={48} y={64}>Hello</Note></Canvas>

// New optional JSONL path
<DocumentCanvas events={events} widgetAdapters={adapters} readOnly={false} onEvent={appendEvent} />

// Immutable compilation target
<PublishedCanvas presentation={canonicalProjection} />
```

- Internal renderer consumes a resolved block view model but reuses Tiny Canvas styles, zoom, selection geometry, cards and frame behavior. `PublishedCanvas` must not initialize localStorage mutations or offer persistence controls.
- Expand `Canvas` authorization to support a `StaticWidget` child for the documented canonical variants, without permitting arbitrary raw DOM children to bypass the contract.
- Render projection `connectors` as a deterministic read-only layer with stable endpoints, anchor positions, waypoints, routes and labels. The current Tiny Canvas is missing this layer.
- Implement every schema `content.kind`: note, markdown, image, link, frame, file, code, component, gallery, controls, prompt, terminal, agent, redacted, unavailable. Make each a *purposeful, accessible* read-only representation, not merely generic JSON text.
- Support relative asset URLs under non-root Vite base paths, snapshot light/dark variants, link safety, code escaping, mobile viewport, color mode, iframe policies, keyboard use, and semantically meaningful fallback text.
- Original MDX pages must still import arbitrary React components and compose inside existing authorized `Block` wrappers. Existing gestures and copy-changes do not change.

**Exit:** all 15 projection kinds and connectors render deterministically in a compiled site; no Hypercanvas runtime; MDX demo regression is green.

### T3 — Make MDX page discovery genuinely first-class

The current `packages/tiny-canvas/src/vite.js` only indexes static `.tsx` page files, even though the demo config can compile `.mdx`.

- Extend page discovery and virtual manifest to `.mdx` and `.tsx` without double-registering React Router routes or mistaking arbitrary markdown for canvases.
- Use a parser or controlled module metadata rather than relying only on a `/<Canvas\\b/` regex for complex MDX/TSX. Support imports/aliased `Canvas` and nested page folders while keeping route names stable.
- Permit `DocumentCanvas` pages sourced from JSONL via explicit page manifest entries; don't require creating a generated MDX file to register them.
- Keep page selector and `virtual:tiny-canvas-pages` behavior unchanged for existing TSX callers; add isolation tests for mixed MDX, TSX, JSONL and prototype routes.

**Exit:** independent Tiny Canvas MDX authoring remains a documented demo, and mixed projects have correct navigation and deep links.

### T4 — Source-backed JSONL editing for teams

- Introduce explicit persistence modes: `local` (default MDX), `document` (append source event), `none` (immutable projection); never silently write both localStorage and JSONL.
- Define an operation sink that maps drag, resize, content changes, remove/add, and connector operations into well-formed events. Preserve event IDs, concurrency checks, batch atomicity and undo/redo semantics.
- The **local dev adapter** can write to disk, but browser/public site builds must be non-mutating; no writable endpoint or auto-write token in public output.
- Debounce/coalesce high-frequency drag events, optimistic-update the UI, reconcile rejected stale revisions and apply HMR without dropping draft edits. Handle an agent and a human editing the same file.
- Provide a CLI: `tiny-canvas document validate <file>`, `materialize <file>`, and `append <file> --event <json>` (naming to be confirmed). The CLI is equally usable by a human or an agent; source files remain human-readable in Git.
- Treat saved JSONL coordinates as authoritative in document mode; `Copy changes` in default MDX mode continues to work as before.

**Exit:** one teammate can locally drag a widget or ask an agent to edit it, observe the JSONL diff, commit, and rebuild with no Hypercanvas.

### T5 — Canonical projections rebuilt offline, extensibility and generated agent guidance

- Implement a **portable widget type**-to-canonical-presentation registry. Rebuild projection JSON from the current document on **every** production build; do not trust precomputed export-time projections after a teammate edits the JSONL. Each portable type is explicitly supported and tested; registered custom components must ship source/renderer in the project or normalize to a safe canonical variant. Never omit unknown types.
- Provide a `PublishedCanvas` static read-only renderer with no editable Core endpoint dependencies; schema validation ensures content variants are allowlisted, but additional URL/privacy policy is enforced at build.
- Build `AGENTS.md` from the **actual** `canvas-publication` inventory: project layout, pages, routes, widget classes used with counts/props, custom components, static projection variants, artifacts/assets, editing commands, limitations and source/generated ownership.
- Store the canonical agent-guide template in Tiny Canvas, parameterize from the manifest, and let producer tools supply their widget-specific editable field descriptions. The resulting document must be valid standalone, with no references to unpublished Hypercanvas APIs.
- Add golden snapshots and accessibility tests for every static variant, a source/projection ID-bijection verifier, privacy leak tests and multi-page rebuild tests.

**Exit:** a newcomer can clone the published Git repo, read its AGENTS.md, modify a JSONL canvas/prototype/MDX page with an agent, run tests, and ship a static site **whose projection reflects the new JSONL content**, without running Hypercanvas.

## Proposed implementation touchpoints

| Location | Work |
| --- | --- |
| `schemas/*.schema.json` | Stable v1 public contracts (started in this branch) |
| `packages/tiny-canvas/package.json`, `scripts/sync-schemas.mjs` | Distribute versioned schemas through npm (started) |
| `packages/tiny-canvas/src/document/*` | Pure decoder/materializer, validators and serializers |
| `packages/tiny-canvas/src/DocumentCanvas.jsx` | JSONL-to-Tiny-Canvas adapter |
| `packages/tiny-canvas/src/PublishedCanvas.jsx` | Canonical read-only projection renderer |
| `packages/tiny-canvas/src/StaticWidget*.` | Accessible variants, no live-runtime dependencies |
| `packages/tiny-canvas/src/vite.js` | MDX/TSX/JSONL page discovery and local source adapter |
| `packages/tiny-canvas/src/index.d.ts` | All new public types and exports |
| `demo/src/pages/canvas/*` | Parallel authoring examples, including true MDX |
| `packages/tiny-canvas/src/*.test.*` | Compatibility, geometry, renderer, privacy, and HMR tests |

## What is deliberately excluded

- Making all Tiny Canvas authors write JSONL.
- Decompiling arbitrary MDX/React source into a universal JSONL representation.
- Auto-merging concurrent Git changes in the published repository.
- Running Hypercanvas terminal, prompt, agent or plugin services in a published site.
- Treating a screenshot as a sufficient replacement for the canonical semantic representation of **every** widget.

## Release gates

1. Typecheck/build/package and import all three schemas from a clean consumer installation.
2. Vite demo with MDX-only board unchanged; separate JSONL-only and mixed demo pass.
3. Render all canonical variants including 18 Hypercanvas built-ins and registered custom widget projection cases.
4. Full document/materializer parity and lossless stable identity across export, replay, compaction, and re-export.
5. Static bundle contains no Hypercanvas package or private runtime, and no file-editing API.
6. Real browser diff checks for geometry and layout, pages and deep links, base-path asset resolution, keyboard/a11y and no persistent editing on public pages.
7. Publish/re-edit/republish with forced conflict passes without overwriting consumer changes.

Implement these phases incrementally on reviewable branches; do not publish a breaking Tiny Canvas version until the consumer end-to-end fixtures pass.
