import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materializeFromText, validateCanvasJsonl } from '@dfosco/hypercanvas/canvas/materializer';
import canvasSchema from '@dfosco/hypercanvas/canvas/document.schema.json' with { type: 'json' };

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
assert.equal(canvasSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.ok(canvasSchema.$defs, 'public JSON schema import is readable');
const referenceText = await read('../src/hyperbase/canvas/chrome-components.canvas.jsonl');
assert.deepEqual(validateCanvasJsonl(referenceText), [], 'real reference canvas validates');
const reference = materializeFromText(referenceText);
const byId = new Map(reference.widgets.map((widget) => [widget.id, widget]));
for (const id of ['markdown-szmufq', 'prototype-tzc6sd', 'image-fqj3ky', 'component-set-s9bwxq', 'story-tf46kt']) {
  assert.ok(byId.has(id), `stable reference widget ID ${id} remains present`);
}
assert.ok(referenceText.includes('\"id\":\"agent-28v68i\"'), 'historical agent add/remove events are preserved in the stream');
assert.equal(byId.get('prototype-tzc6sd').props.src, '/chrome-overview');
assert.equal(byId.get('image-fqj3ky').props.src, 'chrome-components--2026-10-09--04-56-21-n6th.png');
assert.ok(!referenceText.includes("from '@dfosco/hypercanvas'"), 'sample avoids the app-facing Hypercanvas root export');

const buttonPatternsText = await read('../src/hyperbase/canvas/button-patterns.canvas.jsonl');
assert.deepEqual(validateCanvasJsonl(buttonPatternsText), [], 'actual Button Patterns reference validates');
const buttonPatterns = materializeFromText(buttonPatternsText);
assert.deepEqual(buttonPatterns.sources.map(({ export: name }) => name), ['PrimaryButtons', 'DangerButtons']);
assert.equal(buttonPatterns.widgets.find(({ type }) => type === 'prototype').props.src, '/Example?flow=Example%2Fdefault');
assert.deepEqual(buttonPatterns.sources.map(({ export: name }) => name), ['PrimaryButtons', 'DangerButtons']);
const sharedButtonPatterns = materializeFromText(await read('./fixtures/tiny-canvas/button-patterns-reference.jsonl'));
assert.deepEqual(sharedButtonPatterns.sources.map(({ export: name }) => name), ['PrimaryButtons', 'DangerButtons']);

const restoredText = await read('./fixtures/provider/v2-layout-restored.jsonl');
assert.deepEqual(validateCanvasJsonl(restoredText), [], 'accepted required restoration extension validates');
const restored = materializeFromText(restoredText);
assert.equal(restored.scroll.axis, 'both');
assert.deepEqual(restored.widgets[0].position, { x: 1, y: 2 });
assert.equal(Object.hasOwn(restored.widgets[0], 'props'), false);
assert.deepEqual(restored.widgets[1].props, { content: 'keep', width: 180 });
assert.equal(Object.hasOwn(restored, 'sources'), false);

for (const name of ['invalid-layout-restored-missing-value', 'unknown-required']) {
  const diagnostics = validateCanvasJsonl(await read(`./fixtures/provider/${name}.jsonl`));
  assert.ok(diagnostics.length, `${name} fails closed`);
}
console.log('actual references, shared Button Patterns fixture, public schema, required restoration and fail-closed fixtures passed');
