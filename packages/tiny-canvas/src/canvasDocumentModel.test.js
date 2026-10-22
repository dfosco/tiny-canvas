import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectCanvasDocument } from './canvasDocumentModel';

const referenceText = readFileSync(
  new URL('../test/fixtures/canvas-document/button-patterns-reference.jsonl', import.meta.url),
  'utf8'
);
const referenceState = JSON.parse(referenceText.split(/\r?\n/, 1)[0]);

describe('canvas document projection', () => {
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
