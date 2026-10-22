import { materializeFromText, validateCanvasJsonl } from '@dfosco/hypercanvas/canvas/materializer';
import { useCallback, useMemo, useRef, useState } from 'react';
import Block from './Block';
import Canvas from './Canvas';
import Frame from './Frame';
import Image from './Image';
import Link from './Link';
import Mark from './Mark';
import Note from './Note';
import {
  readDocumentGeometry,
  resetDocumentGeometry,
  updateDocumentGeometry,
  writeDocumentGeometry,
} from './canvasDocumentLayout';
import { projectCanvasDocument } from './canvasDocumentModel';

function localStorageOrNull() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseDocument(source) {
  try {
    const diagnostics = validateCanvasJsonl(source);
    if (diagnostics.length) return { diagnostics, state: null };
    return { diagnostics: [], state: materializeFromText(source) };
  } catch (error) {
    return {
      state: null,
      diagnostics: [
        {
          code: 'materialization_failed',
          line: 0,
          message:
            error instanceof Error ? error.message : 'Canvas document failed to load.',
        },
      ],
    };
  }
}

function DiagnosticList({ diagnostics }) {
  if (!diagnostics.length) return null;
  return (
    <section className="tc-canvas-document-diagnostics" role="status" aria-live="polite">
      <h2>Canvas document diagnostics</h2>
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.code}-${diagnostic.itemId || diagnostic.line || index}`}>
            {diagnostic.line ? `Line ${diagnostic.line}: ` : ''}
            <code>{diagnostic.code}</code>: {diagnostic.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

function scrollStyle(axis) {
  switch (axis) {
    case 'vertical':
      return { overflowX: 'hidden', overflowY: 'auto' };
    case 'horizontal':
      return { overflowX: 'auto', overflowY: 'hidden' };
    case 'none':
      return { overflowX: 'hidden', overflowY: 'hidden' };
    default:
      return { overflowX: 'auto', overflowY: 'auto' };
  }
}

function renderCanvasItem(item, onCommit) {
  const { id, type, props = {}, geometry, sourceGeometry } = item;
  const position = { x: geometry.x, y: geometry.y };
  const onPositionCommit = (next) =>
    onCommit(id, sourceGeometry, { ...geometry, ...next });
  const onSizeCommit = (next) =>
    onCommit(id, sourceGeometry, { ...geometry, ...next });
  const common = {
    id,
    ...position,
    persistPosition: false,
    onPositionCommit,
  };
  const sized = {
    ...common,
    width: geometry.width,
    height: geometry.height,
    persistSize: false,
    onSizeCommit,
  };

  switch (type) {
    case 'sticky-note':
      return <Note key={id} {...sized} text={props.text ?? ''} color={props.color || 'yellow'} />;
    case 'markdown':
      return <Mark key={id} {...sized} content={props.content ?? ''} />;
    case 'image':
      return <Image key={id} {...sized} src={props.src} alt={props.alt ?? ''} />;
    case 'link':
      return (
        <Link
          key={id}
          {...common}
          url={props.url}
          title={props.title}
          displayUrl={props.displayUrl}
          width={geometry.width}
          height={geometry.height}
        />
      );
    case 'prototype':
      return (
        <Frame
          key={id}
          {...sized}
          route={props.route}
          title={props.title ?? props.label ?? ''}
        />
      );
    case 'jsx-source': {
      const Source = item.Component;
      return (
        <Block
          key={id}
          {...common}
          className="tc-canvas-document-source"
          style={{ width: geometry.width, height: geometry.height }}
        >
          <Source />
        </Block>
      );
    }
    default:
      return null;
  }
}

/** Read and render a validated Hypercanvas JSONL document without mutating its source. */
function CanvasDocumentInstance({
  id,
  source,
  title,
  appBase = '/',
  resourceBase = '/',
  assets = {},
  sourceExports = {},
  className,
  style,
}) {
  const parsed = useMemo(() => parseDocument(source), [source]);
  const [overrides, setOverrides] = useState(() =>
    id && typeof window !== 'undefined'
      ? readDocumentGeometry(localStorageOrNull(), id)
      : {}
  );
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  const projection = useMemo(
    () =>
      parsed.state
        ? projectCanvasDocument(parsed.state, {
            appBase,
            resourceBase,
            assets,
            sourceExports,
            overrides,
          })
        : { items: [], diagnostics: [] },
    [appBase, assets, overrides, parsed.state, resourceBase, sourceExports]
  );
  const onCommit = useCallback(
    (itemId, basis, geometry) => {
      const next = updateDocumentGeometry(
        overridesRef.current,
        itemId,
        basis,
        geometry
      );
      overridesRef.current = next;
      setOverrides(next);
      if (id) writeDocumentGeometry(localStorageOrNull(), id, next);
    },
    [id]
  );
  const reset = useCallback(() => {
    if (id) resetDocumentGeometry(localStorageOrNull(), id);
    overridesRef.current = {};
    setOverrides({});
  }, [id]);

  const diagnostics = [...parsed.diagnostics, ...projection.diagnostics];
  if (!parsed.state) {
    return (
      <main className={className} style={style}>
        <DiagnosticList diagnostics={diagnostics} />
      </main>
    );
  }

  const canvas = parsed.state;
  return (
    <div className={['tc-canvas-document', className].filter(Boolean).join(' ')}>
      <DiagnosticList diagnostics={diagnostics} />
      <Canvas
        title={title || canvas.title}
        grid={Boolean(canvas.grid)}
        gridSize={canvas.gridSize}
        colorMode={canvas.colorMode || 'auto'}
        canvasWidth={canvas.width || 10000}
        canvasHeight={canvas.height || 10000}
        resettable
        resetLabel="Reset local layout"
        copyable={false}
        onReset={reset}
        className="tc-canvas-document-board"
        style={{ ...scrollStyle(canvas.scroll?.axis), ...style }}
      >
        {projection.items.map((item) => (
          renderCanvasItem(item, onCommit)
        ))}
      </Canvas>
    </div>
  );
}

export default function CanvasDocument(props) {
  return <CanvasDocumentInstance key={props.id || ''} {...props} />;
}
