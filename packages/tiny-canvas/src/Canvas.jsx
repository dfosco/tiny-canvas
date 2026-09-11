import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CanvasContext } from './CanvasContext';
import PageSelector, {
  getCanvasConfig,
  getCanvasPageContext,
} from './PageSelector';
import { isAuthorizedCanvasChild } from './canvasChild';
import { writeClipboardText } from './clipboard';
import { useResetCanvas } from './useResetCanvas';
import {
  formatCanvasChanges,
  generateBlockId,
  getCanvasChanges,
} from './utils';

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.indexOf(1);
const WHEEL_ZOOM_THRESHOLD = 40;
const DEFAULT_CANVAS_WIDTH = 10000;
const DEFAULT_CANVAS_HEIGHT = 10000;

function canvasDimension(value, propName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`Canvas ${propName} must be a positive finite number.`);
  }

  return value;
}

function Canvas({
  children,
  title,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  dotted = false,
  grid = false,
  gridSize = 36,
  colorMode = 'auto',
  resettable = false,
  resetLabel = 'Reset board',
  copyable = resettable,
  copyLabel = 'Copy changes',
  copiedLabel = 'Copied',
  onCopyChanges,
  className,
  style,
  onPointerDown,
  onWheel,
  onSelectionChange,
  ...rest
}) {
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [copyStatus, setCopyStatus] = useState('idle');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const canvasRef = useRef(null);
  const zoomIndexRef = useRef(DEFAULT_ZOOM_INDEX);
  const wheelZoomDeltaRef = useRef(0);
  const pendingZoomAnchorRef = useRef(null);
  const copyStatusTimer = useRef(null);
  const resetCanvas = useResetCanvas({ reload: true });
  useEffect(
    () => () => clearTimeout(copyStatusTimer.current),
    []
  );
  const showDots = dotted || grid;
  const zoom = ZOOM_LEVELS[zoomIndex];
  const boardWidth = canvasDimension(canvasWidth, 'canvasWidth');
  const boardHeight = canvasDimension(canvasHeight, 'canvasHeight');
  const canvasConfig = getCanvasConfig();
  const pageContext = getCanvasPageContext(canvasConfig);
  const pageId = pageContext?.currentPage.id;
  const blockIds = new Set();
  const blocks = new Map();
  const zoomAt = useCallback((nextIndex, clientX, clientY) => {
    const canvas = canvasRef.current;
    const resolvedIndex = Math.max(
      0,
      Math.min(ZOOM_LEVELS.length - 1, nextIndex)
    );
    const currentIndex = zoomIndexRef.current;
    if (!canvas || resolvedIndex === currentIndex) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const viewportX = clientX - rect.left;
    const viewportY = clientY - rect.top;
    const currentZoom = ZOOM_LEVELS[currentIndex];
    pendingZoomAnchorRef.current = {
      canvas,
      contentX: (canvas.scrollLeft + viewportX) / currentZoom,
      contentY: (canvas.scrollTop + viewportY) / currentZoom,
      viewportX,
      viewportY,
    };
    zoomIndexRef.current = resolvedIndex;
    setZoomIndex(resolvedIndex);
  }, []);

  const zoomAtViewportCenter = (nextIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    zoomAt(
      nextIndex,
      rect.left + canvas.clientWidth / 2,
      rect.top + canvas.clientHeight / 2
    );
  };

  const zoomByWheel = useCallback(
    (deltaY, clientX, clientY) => {
      wheelZoomDeltaRef.current -= deltaY;
      if (Math.abs(wheelZoomDeltaRef.current) < WHEEL_ZOOM_THRESHOLD) {
        return;
      }

      const direction = Math.sign(wheelZoomDeltaRef.current);
      wheelZoomDeltaRef.current = 0;
      zoomAt(zoomIndexRef.current + direction, clientX, clientY);
    },
    [zoomAt]
  );

  useLayoutEffect(() => {
    const anchor = pendingZoomAnchorRef.current;
    if (!anchor) {
      return;
    }

    anchor.canvas.scrollLeft = anchor.contentX * zoom - anchor.viewportX;
    anchor.canvas.scrollTop = anchor.contentY * zoom - anchor.viewportY;
    pendingZoomAnchorRef.current = null;
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const handleWheelZoom = (event) => {
      if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      zoomByWheel(event.deltaY, event.clientX, event.clientY);
    };
    canvas.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelZoom);
  }, [zoomByWheel]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashQueryIndex = url.hash.indexOf("?");
    const hashParams = new URLSearchParams(
      hashQueryIndex === -1 ? "" : url.hash.slice(hashQueryIndex + 1)
    );
    const frameId =
      hashParams.get("tcFrame") || url.searchParams.get("tcFrame");
    const canvas = canvasRef.current;
    if (!frameId || !canvas) {
      return undefined;
    }

    let timeout;
    let attempts = 0;
    const centerTarget = () => {
      const target = [...canvas.querySelectorAll("[data-block-id]")].find(
        (element) =>
          element.dataset.blockId === frameId || element.id === frameId
      );
      if (target) {
        target.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "center",
        });
        target.focus({ preventScroll: true });
        const rect = target.getBoundingClientRect();
        const horizontallyCentered =
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < 2;
        const verticallyCentered =
          Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) < 2;
        if (horizontallyCentered && verticallyCentered) return;
      }
      attempts += 1;
      if (attempts < 40) {
        timeout = window.setTimeout(centerTarget, 100);
      }
    };
    timeout = window.setTimeout(centerTarget, 0);

    return () => window.clearTimeout(timeout);
  }, [pageId]);

  const contextValue = useMemo(
    () => ({
      selectedBlockId,
      selectBlock: (nextBlockId) => {
        setSelectedBlockId(nextBlockId);
        onSelectionChange?.(nextBlockId);
      },
      zoom,
      zoomByWheel,
    }),
    [onSelectionChange, selectedBlockId, zoom, zoomByWheel]
  );
  const renderedChildren = Children.map(children, (child, index) => {
    if (child === null || child === undefined || child === false) {
      return null;
    }

    if (!isValidElement(child) || !isAuthorizedCanvasChild(child)) {
      throw new TypeError(
        'Canvas only accepts authorized canvas components such as <Block>, <Frame>, <Note>, <Mark>, <Link>, and <Image>.'
      );
    }

    const component =
      child.type.displayName || child.type.name || 'Canvas component';
    const configuredProps = canvasConfig?.widgets?.[component];
    const widgetDefaults =
      configuredProps && typeof configuredProps === 'object'
        ? Object.fromEntries(
            Object.entries(configuredProps).filter(
              ([property]) =>
                !['id', 'blockId', 'children'].includes(property)
            )
          )
        : {};
    const sourceId = child.props.id || generateBlockId(child, index);
    const blockId = pageId
      ? `tc-page:${encodeURIComponent(pageId)}:${sourceId}`
      : sourceId;
    if (blockIds.has(blockId)) {
      throw new TypeError(`Canvas block IDs must be unique: "${blockId}".`);
    }
    blockIds.add(blockId);
    blocks.set(blockId, {
      component,
      index,
      sourceId,
      ...(pageId
        ? { pageId, pageTitle: title || pageContext.currentPage.title }
        : {}),
      ...(child.key === null ? {} : { key: String(child.key) }),
    });

    return cloneElement(child, {
      ...widgetDefaults,
      ...child.props,
      key: blockId,
      blockId,
    });
  });

  return (
    <CanvasContext.Provider value={contextValue}>
      <main
        {...rest}
        ref={canvasRef}
        className={['tc-canvas', className].filter(Boolean).join(' ')}
        data-dotted={showDots || undefined}
        data-color-mode={colorMode !== 'auto' ? colorMode : undefined}
        style={{
          '--tc-grid-size': `${gridSize}px`,
          ...style,
        }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            contextValue.selectBlock(null);
          }
          onPointerDown?.(event);
        }}
        onWheel={onWheel}
      >
        <PageSelector title={title} />
        <div
          className="tc-canvas-board"
          style={{
            '--tc-canvas-zoom': zoom,
            '--tc-canvas-width': `${boardWidth}px`,
            '--tc-canvas-height': `${boardHeight}px`,
          }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              contextValue.selectBlock(null);
            }
          }}
        >
          {renderedChildren}
        </div>
        <div className="tc-canvas-controls tc-no-drag">
          <div className="tc-canvas-zoom" role="group" aria-label="Canvas zoom">
            <button
              type="button"
              className="tc-canvas-control tc-canvas-zoom-button"
              aria-label="Zoom out"
              disabled={zoomIndex === 0}
              onClick={() =>
                zoomAtViewportCenter(zoomIndexRef.current - 1)
              }
            >
              −
            </button>
            <button
              type="button"
              className="tc-canvas-control tc-canvas-zoom-value"
              aria-label="Reset zoom"
              onClick={() => zoomAtViewportCenter(DEFAULT_ZOOM_INDEX)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="tc-canvas-control tc-canvas-zoom-button"
              aria-label="Zoom in"
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              onClick={() =>
                zoomAtViewportCenter(zoomIndexRef.current + 1)
              }
            >
              +
            </button>
          </div>
          {resettable ? (
            <button
              type="button"
              className="tc-canvas-control"
              onClick={resetCanvas}
            >
              {resetLabel}
            </button>
          ) : null}
          {copyable ? (
            <button
              type="button"
              className="tc-canvas-control"
              onClick={async () => {
                const changes = getCanvasChanges(blocks);
                const text = formatCanvasChanges(changes);
                try {
                  await writeClipboardText(text);
                } catch (error) {
                  console.error('Error copying canvas changes:', error);
                  setCopyStatus('failed');
                  return;
                }

                setCopyStatus('copied');
                onCopyChanges?.(changes, text);
                clearTimeout(copyStatusTimer.current);
                copyStatusTimer.current = setTimeout(
                  () => setCopyStatus('idle'),
                  1600
                );
              }}
            >
              {copyStatus === 'copied'
                ? copiedLabel
                : copyStatus === 'failed'
                  ? 'Copy failed'
                  : copyLabel}
            </button>
          ) : null}
        </div>
      </main>
    </CanvasContext.Provider>
  );
}

export default Canvas;
