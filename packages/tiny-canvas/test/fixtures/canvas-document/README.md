# Canvas document fixtures

- `v1-legacy.jsonl`: unversioned legacy stream; missing `scroll.axis` plays as `both`.
- `v2-layout.jsonl`: explicit v2 compound event, JSON widget geometry, JSX source geometry, and preserved extensions.
- `v2-compacted.jsonl`: equivalent v2 baseline after compaction; prior event history is intentionally absent.
- `invalid-layout.jsonl`: duplicate widget IDs must reject atomically.
- `invalid-moved-position.jsonl`: the strict authoring surface requires both numeric position coordinates; tolerant playback preserves the legacy partial record behavior.
- `unknown-required.jsonl`: unsupported required event must produce an incompatibility error.
- `unknown-optional.jsonl`: optional future extension is ignored by this reader.
- `button-patterns-reference.jsonl`: copied from repository reference `src/canvas/button-patterns.canvas.jsonl`; includes sticky-note, Markdown, prototype Frame widgets and the `PrimaryButtons`/`DangerButtons` source exports.

The reference fixture preserves the source document bytes. The normalized protocol fixtures are deliberately small and do not represent a second canonical canvas format.

The playback tests verify JSONL state only. E's writer remains responsible for proving each JSX source export against the current canvas/module/importer binding before emitting geometry; fixture strings are not authorization to inject source exports.

The exported Draft 2020-12 record schema accepts each record in `invalid-layout.jsonl`; the strict stream validator rejects the duplicate widget IDs across its layout snapshot. It accepts the optional unknown record and rejects the required unknown record in `unknown-optional.jsonl` and `unknown-required.jsonl`. Both public surfaces reject the partial position in `invalid-moved-position.jsonl` for authoring, while legacy playback still applies that stored partial position.
