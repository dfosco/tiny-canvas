import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectCanvasDocument } from './canvasDocumentModel';

const referenceText = readFileSync(
  new URL('../test/fixtures/canvas-document/button-patterns-reference.jsonl', import.meta.url),
  'utf8'
);
const referenceState = JSON.parse(referenceText.split(/\r?\n/, 1)[0]);

describe('canvas document projection', () => {
  it('does not duplicate an app base already present in prototype and resource paths', () => {
    const { items, diagnostics } = projectCanvasDocument(
      {
        widgets: [
          {
            id: 'prefixed-prototype',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: '/branch--demo/Prototype?variant=a#state' },
          },
          {
            id: 'prefixed-image',
            type: 'image',
            position: { x: 0, y: 0 },
            props: { src: '/branch--demo/assets/image.png?size=2#preview' },
          },
          {
            id: 'unprefixed-prototype',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: '/Prototype?variant=b#next' },
          },
          {
            id: 'relative-prototype',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: 'Prototype?variant=c#last' },
          },
          {
            id: 'prefix-lookalike',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: '/branch--demo-copy/Prototype?variant=d#lookalike' },
          },
        ],
      },
      { appBase: '/branch--demo/', resourceBase: '/branch--demo/docs/' }
    );

    expect(diagnostics).toEqual([]);
    expect(items.map((item) => item.props.route ?? item.props.src)).toEqual([
      '/branch--demo/Prototype?variant=a#state',
      '/branch--demo/assets/image.png?size=2#preview',
      '/branch--demo/Prototype?variant=b#next',
      '/branch--demo/Prototype?variant=c#last',
      '/branch--demo/branch--demo-copy/Prototype?variant=d#lookalike',
    ]);
  });

  it('accepts only same-origin absolute prototype URLs and leaves foreign origins diagnostic', () => {
    const { items, diagnostics } = projectCanvasDocument(
      {
        widgets: [
          {
            id: 'same-origin',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: 'https://demo.test/Prototype?variant=a#state' },
          },
          {
            id: 'foreign-origin',
            type: 'prototype',
            position: { x: 0, y: 0 },
            props: { src: 'https://elsewhere.test/Prototype?variant=b#state' },
          },
        ],
      },
      { appBase: '/branch--demo/', currentOrigin: 'https://demo.test' }
    );

    expect(items.map((item) => [item.id, item.props.route])).toEqual([
      ['same-origin', 'https://demo.test/Prototype?variant=a#state'],
    ]);
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'unsupported_prototype_source',
        itemId: 'foreign-origin',
      }),
    ]);
  });

  it('maps supported reference widgets with stable identities and preserves local routes', () => {
    const { items, diagnostics } = projectCanvasDocument(referenceState, {
      appBase: '/preview/',
      sourceExports: {
        PrimaryButtons: () => null,
        DangerButtons: () => null,
      },
    });

    expect(diagnostics).toEqual([]);
    expect(items.map(({ id, type }) => [id, type])).toEqual([
      ['sticky-1', 'sticky-note'],
      ['md-1', 'markdown'],
      ['sticky-note-oxe2rj', 'sticky-note'],
      ['prototype-wltmlu', 'prototype'],
      ['sticky-note-uwl16w', 'sticky-note'],
      ['source:PrimaryButtons', 'jsx-source'],
      ['source:DangerButtons', 'jsx-source'],
    ]);
    expect(items.find((item) => item.id === 'prototype-wltmlu').props.route).toBe(
      '/preview/Example?flow=Example%2Fdefault'
    );
  });

  it('resolves local images under document resources and keeps public web URLs', () => {
    const { items, diagnostics } = projectCanvasDocument(
      {
        widgets: [
          {
            id: 'local',
            type: 'image',
            position: { x: 0, y: 0 },
            props: { src: 'assets/diagram.png' },
          },
          {
            id: 'external',
            type: 'image',
            position: { x: 0, y: 0 },
            props: { src: 'https://example.test/photo.png' },
          },
        ],
      },
      {
        appBase: '/site/',
        resourceBase: '/site/src/canvas/docs/',
        assets: { 'assets/diagram.png': '/site/assets/diagram-HASH.png' },
      }
    );

    expect(diagnostics).toEqual([]);
    expect(items.map((item) => item.props.src)).toEqual([
      '/site/assets/diagram-HASH.png',
      'https://example.test/photo.png',
    ]);
  });

  it('reports unsupported widgets, connector behavior and unavailable executable companions', () => {
    const { items, diagnostics } = projectCanvasDocument({
      widgets: [
        {
          id: 'future-widget',
          type: 'chart',
          position: { x: 0, y: 0 },
          props: {},
        },
      ],
      sources: [
        {
          export: 'PrimaryButtons',
          position: { x: 10, y: 20 },
          width: 300,
          height: 200,
        },
      ],
      connectors: [{ id: 'wire-1' }],
    });

    expect(items).toEqual([]);
    expect(diagnostics.map(({ code }) => code)).toEqual([
      'unsupported_widget',
      'missing_jsx_companion',
      'unsupported_connectors',
    ]);
    expect(diagnostics[1].message).toContain('explicit sourceExports binding');
  });

  it('ignores stale local layout when source geometry changes', () => {
    const state = {
      widgets: [
        {
          id: 'note-1',
          type: 'sticky-note',
          position: { x: 10, y: 20 },
          props: { width: 300, height: 150 },
        },
      ],
    };
    const overrides = {
      'note-1': {
        basis: { x: 10, y: 20, width: 300, height: 150 },
        geometry: { x: 70, y: 80, width: 400, height: 250 },
      },
    };

    expect(projectCanvasDocument(state, { overrides }).items[0].geometry).toEqual(
      overrides['note-1'].geometry
    );
    state.widgets[0].props.width = 320;
    expect(projectCanvasDocument(state, { overrides }).items[0].geometry).toEqual(
      { x: 10, y: 20, width: 320, height: 150 }
    );
  });

  it('uses the checked-in shared protocol fixture, including unknown-required failure evidence', () => {
    const required = readFileSync(
      new URL('../test/fixtures/canvas-document/unknown-required.jsonl', import.meta.url),
      'utf8'
    );
    const optional = readFileSync(
      new URL('../test/fixtures/canvas-document/unknown-optional.jsonl', import.meta.url),
      'utf8'
    );

    expect(referenceState.title).toBe('Button Patterns');
    expect(required).toContain('"required":true');
    expect(optional).toContain('future_decoration_v3');
  });
});
