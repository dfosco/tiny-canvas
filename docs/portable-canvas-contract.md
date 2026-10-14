# Portable Canvas Contract (v1)

**Status:** proposed public schema; implementation of the JSONL materializer, source-backed editing, and static renderers is planned, not yet shipped.  
**Owners:** Tiny Canvas owns the open document/presentation contract and its renderer. A producer such as Hypercanvas owns adapters from its private widgets into this contract.

## Goals

1. Preserve **MDX/TSX as first-class, independent Tiny Canvas authoring**. The existing `<Canvas><Note ... /></Canvas>` API and its localStorage behavior must not depend on JSONL.
2. Add a **second, optional JSONL authoring/consumption path**: a pure event materializer plus a `DocumentCanvas` React adapter. No Hypercanvas Core dependency.
3. Define **one canonical read-only projection per widget** for immutable compilation targets. Web publishing is the first target, but the contract must be target-neutral.
4. Publish portable source and editable React prototypes/assets to a Git repository that teammates can modify without installing Hypercanvas.
5. Never conflate the mutable source document with its generated projection.

## Public JSON Schemas

- [`schemas/canvas-events.v1.schema.json`](../schemas/canvas-events.v1.schema.json): validates **one JSONL event record**, including the existing `canvas_created`, widget, connector, settings, and source event families. A stream parser must separately validate ordering, identifiers, and references.
- [`schemas/canvas-presentation.v1.schema.json`](../schemas/canvas-presentation.v1.schema.json): validates one immutable, **sanitized** read-only presentation. Requires source provenance, stable widget IDs, geometry, a typed content variant, and the complete list of connectors.
- [`schemas/canvas-publication.v1.schema.json`](../schemas/canvas-publication.v1.schema.json): validates the portable publication inventory: authored pages, editable source paths, generated assets/projections, widget catalog, ownership, and agent-guide inputs.

All three schemas use JSON Schema Draft 2020-12 and have independent version numbers. These files define a planned contract; adding schemas does **not** imply that Tiny Canvas currently implements the JSONL runtime, publish compiler, or MDX discovery in its Vite page plugin.

A canonical JSONL document starts with a versioned, fully materialized `canvas_created` event and may be followed by subsequent events:

```jsonl
{"event":"canvas_created","formatVersion":1,"documentId":"research","title":"Research","widgets":[{"id":"note-1","type":"note","originType":"sticky-note","position":{"x":48,"y":80},"props":{"markdown":"Review the navigation","color":"yellow","width":270,"height":170}}],"connectors":[]}
{"event":"widget_moved","widgetId":"note-1","position":{"x":64,"y":96}}
```

Exporters SHOULD compact private histories into one initial `canvas_created` record containing the current state. Newly authored changes then append deterministic, validated events. The **event vocabulary** matches Hypercanvas v1, but exported widget `type` values MUST be normalized to the portable enum (`note`, `frame`, `agent`, etc.); a producer-specific type can be recorded as informational `originType`. Private widget props are mapped to public, type-specific props before writing. This is **not** a promise to export machine-local session state or full private history.

A static projection of that document is a **different generated artifact**, for example:

```json
{
  "schemaVersion": 1,
  "readOnly": true,
  "documentId": "research",
  "title": "Research",
  "source": { "kind": "jsonl", "path": "canvas/research.canvas.jsonl", "sha256": "<64 lowercase hex characters>" },
  "widgets": [{
    "id": "note-1",
    "sourceType": "sticky-note",
    "geometry": { "x": 64, "y": 96, "width": 270, "height": 170 },
    "availability": "ready",
    "content": { "kind": "note", "markdown": "Review the navigation", "color": "yellow" }
  }],
  "connectors": []
}
```

The `sha256` field above is explanatory, not a valid literal example checksum. Actual generated projections MUST use a verified hash of their normalized source.

## Three surfaces, one canvas visual language

| Surface | Authored as | Rendered with | Persistence |
| --- | --- | --- | --- |
| Native Tiny Canvas | `.mdx` or `.tsx` with `Canvas`, `Note`, `Frame`, etc. | Existing Tiny Canvas components | Existing localStorage by default; optional explicit custom integration |
| Portable team canvas | `.canvas.jsonl` with stable widget IDs and events | Planned `DocumentCanvas`, which materializes and maps onto Tiny Canvas components | Append events to source through an authorized local dev adapter; Git commits |
| Read-only published target | Derived `.presentation.json` | Planned `PublishedCanvas`/static widget primitives | **None**. Never mutate source or write localStorage |

MDX remains a normal React composition format, not an export intermediate for JSONL. MDX pages can continue importing arbitrary application React components; JSONL needs explicit component registration and a safe, portable reference. Both should coexist in the same Vite project and router. The current Vite plugin discovers only static `.tsx` canvas pages; extend it to correctly discover `.mdx` without breaking non-canvas routes or TSX behavior.

## The canonical presentation contract

On **every local or CI production build**, Tiny Canvas re-materializes the editable portable JSONL and generates exactly **one presentation widget for every source widget**. This preserves stable IDs, geometry, ordering, connector endpoints, accessible text, and navigational links. A teammate's JSONL edits immediately affect the next static build: no stale export-time presentation and no Hypercanvas dependency. No widget may silently disappear because its interactive runtime is missing.

Public content variants v1:

- `note`, `markdown`, `image`, `link`, `frame`, `file`, `code`
- `component`, `gallery`, `controls`, `prompt`, `terminal`, `agent`
- `redacted` and `unavailable` — intentional **visible** results with a public-safe reason, never blank placeholders

The producer maps each private widget to a **portable source widget type and props**. For example, Hypercanvas exports an `agent-chat` widget as a public `agent` type with safe title/summary, or as `redacted`. Tiny Canvas then materializes and projects **portable types** into read-only variants using public adapters. A custom widget must export a supported portable type (often `component`) with an independently distributable renderer, or an explicit `unavailable`/`redacted` representation. No Hypercanvas projector is needed when a teammate rebuilds.

`readOnly: true` means source editing, dragging/resizing persistence, remote sessions, agent execution, filesystem mutation, and terminal processes are disabled. A `frame` may still point to an interactive, bundled **prototype**; that interaction must not mutate the exported document.

Mandatory compiler gates:

- The set of presentation widget IDs equals the exported source widget IDs, with no duplicates or omissions.
- All connector endpoints refer to existing IDs, and their routing/style information is preserved or explicitly diagnosed.
- Every referenced local asset exists inside the published project; external URLs are validated and safe.
- Every source field included in a public projection is allowlisted. No raw session IDs, tokens, absolute local paths, environment variables, private transcripts, or secret-bearing widget props leak.
- Every `availability: redacted` / `unavailable` widget has a typed matching descriptor and a safe explanation; significant lossy mappings appear in diagnostics and the publish report.
- Source digest/projection digest coherence and deterministic serialization are checked before build and after republish.
- Invalid/unknown event types and undeclared custom widget types fail with actionable diagnostics rather than being quietly omitted.
- Signed coordinates must be supported or normalized with a documented origin translation: Tiny Canvas's current JSX `Block` clamps negative coordinates to zero and must not silently deform imported layouts.

**Schema limitation:** JSON Schema verifies shapes; document-level invariants (event ordering, ID bijection, file existence, cross-file checks, privacy, and actual rendering) require executable validators and browser tests.

## Proposed public package APIs

```ts
// Proposed. NOT implemented.
import {
  materializeCanvasEvents,
  parseCanvasJsonl,
  validateCanvasStream,
  validateCanvasPresentation
} from '@dfosco/tiny-canvas/document'

// JSONL: independent of MDX, React, and Hypercanvas
const state = materializeCanvasEvents(parseCanvasJsonl(source))

// React: same underlying Tiny Canvas visual primitives
import { Canvas, Note, Frame, DocumentCanvas, PublishedCanvas } from '@dfosco/tiny-canvas'
```

The `./document` subpath must be browser/Node-safe and React-free, and should expose `compileReadOnlyPresentation(state, { assets, source })` for regeneration directly from portable source. The three schema files are copied from their repository-root source into the published npm package by `scripts/sync-schemas.mjs`, then exposed as `@dfosco/tiny-canvas/schema/events/v1`, `/schema/presentation/v1`, and `/schema/publication/v1`. The JSONL materializer must match the known Hypercanvas reducer events in v1, including connectors, waypoints, updates, inverse/undo forward-events and compaction semantics. Move or independently port the reducer behind contract/parity tests, then eliminate competing definitions.

For editable JSONL in local development, emit validated operations to an authenticated/local-only writer, with optimistic version checks and atomic append. Browser-only/static publication **cannot** persist into source; do not imply that browser edits synchronize to Git. The existing MDX path keeps its localStorage persistence contract.

## Source-to-projection freshness

The normalized `.canvas.jsonl` is the **only editable canvas source** in the handoff. The producer exports its content as public portable widget types and may provide initial `.presentation.json` files for review, but the consumer's `npm run build` MUST regenerate their contents from the current JSONL and public assets. If a widget cannot be rebuilt without Hypercanvas, the producer must embed its safe canonical static state into the portable widget props (or export a redacted/unavailable descriptor). The build verifies the projection's SHA-256 source digest; stale precomputed presentations never reach the published web.

## Packaging and compatibility

- Add JSONL parsing, schema validation, materialization, and event serialization to an opt-in `@dfosco/tiny-canvas/document` subpath.
- Expose both versioned schema files as package assets; use semantic versioning plus an explicit formatVersion gate for breaking changes.
- Add a public portable-type-to-presentation renderer/compiler registry. Read-only representation is mandatory for every portable widget. Producers must normalize custom/private widgets into a portable type and provide any external component implementation in the handoff repository.
- Add TS declarations, example MDX + JSONL side by side, upgrade documentation, fixture documents, Node/browser parity tests, and a standalone Vite build test.
- Source provenance in a presentation is either `jsonl` or `mdx`; an MDX-native compiler may produce the same read-only projection in the future without adopting JSONL.

See [Tiny Canvas implementation plan](./portable-canvas-implementation-plan.md) and the Hypercanvas feature branch plan for the producer/exporter implementation.
