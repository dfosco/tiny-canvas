import { describe, expect, it } from 'vitest';
import {
  canvasDocumentLayoutKey,
  geometryMatchesBasis,
  readDocumentGeometry,
  resolveDocumentGeometry,
  resetDocumentGeometry,
  updateDocumentGeometry,
  writeDocumentGeometry,
} from './canvasDocumentLayout';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

describe('canvas document geometry state', () => {
  it('uses a document-scoped versioned namespace', () => {
    expect(canvasDocumentLayoutKey('/canvas/buttons')).toBe(
      'tiny-canvas:canvas-document-layout:v1:%2Fcanvas%2Fbuttons'
    );
    expect(canvasDocumentLayoutKey('/canvas/buttons')).not.toBe(
      'tiny-canvas-queue'
    );
  });

  it('applies saved geometry only while its complete source basis matches', () => {
    const source = { x: 24, y: 48, width: 300, height: 180 };
    const override = {
      basis: source,
      geometry: { x: 64, y: 96, width: 360, height: 220 },
    };

    expect(geometryMatchesBasis(source, override.basis)).toBe(true);
    expect(resolveDocumentGeometry(source, override)).toEqual(
      override.geometry
    );
    expect(
      resolveDocumentGeometry({ ...source, width: 320 }, override)
    ).toEqual({ ...source, width: 320 });
  });

  it('persists only browser-local geometry and supports reset', () => {
    const storage = createStorage();
    const documentId = '/canvas/buttons';
    const source = { x: 24, y: 48, width: 300, height: 180 };
    const next = updateDocumentGeometry({}, 'widget:sticky-1', source, {
      x: 50,
      y: 60,
      width: 300,
      height: 180,
    });

    expect(writeDocumentGeometry(storage, documentId, next)).toBe(true);
    expect(readDocumentGeometry(storage, documentId)).toEqual(next);
    expect([...storage.values.keys()]).toEqual([
      'tiny-canvas:canvas-document-layout:v1:%2Fcanvas%2Fbuttons',
    ]);
    expect(resetDocumentGeometry(storage, documentId)).toBe(true);
    expect(readDocumentGeometry(storage, documentId)).toEqual({});
  });

  it('ignores malformed browser data and rejects invalid writes', () => {
    const storage = createStorage();
    const documentId = '/canvas/invalid';
    storage.setItem(canvasDocumentLayoutKey(documentId), '{bad');
    expect(readDocumentGeometry(storage, documentId)).toEqual({});
    expect(
      updateDocumentGeometry({}, 'widget:x', { x: 0, y: 0, width: 10, height: 10 }, {
        x: 1,
        y: 1,
        width: 0,
        height: 10,
      })
    ).toEqual({});
  });
});
