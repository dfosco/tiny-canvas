import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Block from './Block';
import { CanvasContext } from './CanvasContext';
import { getSavedSize, saveSize } from './utils';

function dimension(value, propName, componentName) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(
      `${componentName} ${propName} must be a positive finite number.`
    );
  }

  return value;
}

function aspectSize(width, aspectRatio, minWidth, minHeight) {
  const constrainedWidth = Math.max(
    minWidth,
    width,
    minHeight * aspectRatio
  );
  return {
    width: constrainedWidth,
    height: Math.round(constrainedWidth / aspectRatio),
  };
}

export default function ResizableBlock({
  children,
  componentName,
  resizeLabel,
  defaultWidth,
  defaultHeight,
  width = defaultWidth,
  height = defaultHeight,
  minWidth,
  minHeight,
  aspectRatio,
  onSizeChange,
  onSizeCommit,
  persistSize = true,
  id,
  blockId,
  className,
  style,
  surfaceClassName,
  ...blockProps
}) {
  const initialWidth = dimension(width, 'width', componentName);
  const initialHeight = dimension(height, 'height', componentName);
  const minimumWidth = dimension(minWidth, 'minWidth', componentName) ?? 0;
  const minimumHeight = dimension(minHeight, 'minHeight', componentName) ?? 0;
  const lockedAspectRatio = dimension(
    aspectRatio,
    'aspectRatio',
    componentName
  );
  const generatedId = useId().replaceAll(':', '');
  const resolvedId = blockId ?? id ?? `tc-${componentName.toLowerCase()}-${generatedId}`;
  const surfaceRef = useRef(null);
  const resizeStartRef = useRef(null);
  const currentSizeRef = useRef(null);
  const aspectRatioRef = useRef(lockedAspectRatio);
  const canvas = useContext(CanvasContext);
  const zoom = canvas?.zoom ?? 1;
  const [size, setSize] = useState(() => {
    const savedSize = persistSize ? getSavedSize(resolvedId) : null;
    return {
      width:
        savedSize?.width === undefined
          ? initialWidth
          : Math.max(minimumWidth, savedSize.width),
      height:
        savedSize?.height === undefined
          ? initialHeight
          : Math.max(minimumHeight, savedSize.height),
    };
  });

  useLayoutEffect(() => {
    if (!persistSize) {
      setSize({ width: initialWidth, height: initialHeight });
    }
  }, [initialHeight, initialWidth, persistSize]);

  useEffect(() => {
    if (!lockedAspectRatio || aspectRatioRef.current === lockedAspectRatio) {
      return;
    }

    aspectRatioRef.current = lockedAspectRatio;
    setSize((currentSize) => {
      const nextSize = aspectSize(
        currentSize.width ?? initialWidth,
        lockedAspectRatio,
        minimumWidth,
        minimumHeight
      );
      currentSizeRef.current = nextSize;
      return nextSize;
    });
  }, [initialWidth, lockedAspectRatio, minimumHeight, minimumWidth]);

  const updateSize = (nextSize, persist = false) => {
    currentSizeRef.current = nextSize;
    setSize(nextSize);
    onSizeChange?.(nextSize);
    if (persist && persistSize) {
      saveSize(resolvedId, nextSize);
    }
  };

  const finishResize = (event) => {
    const resizeStart = resizeStartRef.current;
    if (!resizeStart || resizeStart.pointerId !== event.pointerId) {
      return;
    }

    const nextSize = currentSizeRef.current;
    resizeStartRef.current = null;
    if (nextSize) {
      if (persistSize) saveSize(resolvedId, nextSize);
      onSizeCommit?.(nextSize);
    }
  };

  return (
    <Block
      {...blockProps}
      id={id}
      blockId={resolvedId}
      className={['tc-resizable-block', className].filter(Boolean).join(' ')}
      style={{
        ...style,
        ...(size.width === undefined ? {} : { width: size.width }),
        ...(size.height === undefined ? {} : { height: size.height }),
      }}
    >
      <div
        ref={surfaceRef}
        className={['tc-resizable-surface', surfaceClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
      <button
        type="button"
        className="tc-resize-handle tc-no-drag"
        aria-label={resizeLabel}
        title="Drag to resize. Use arrow keys for precise resizing."
        onPointerDown={(event) => {
          if (!surfaceRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          const startingSize = {
            width: size.width ?? surfaceRef.current.offsetWidth,
            height: size.height ?? surfaceRef.current.offsetHeight,
          };
          resizeStartRef.current = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            zoom,
            ...startingSize,
          };
          currentSizeRef.current = startingSize;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const resizeStart = resizeStartRef.current;
          if (!resizeStart || resizeStart.pointerId !== event.pointerId) {
            return;
          }

          event.preventDefault();
          const widthDelta =
            (event.clientX - resizeStart.clientX) / resizeStart.zoom;
          const heightDelta =
            (event.clientY - resizeStart.clientY) / resizeStart.zoom;
          if (lockedAspectRatio) {
            const widthFromHeight = heightDelta * lockedAspectRatio;
            const lockedWidthDelta =
              Math.abs(widthDelta) >= Math.abs(widthFromHeight)
                ? widthDelta
                : widthFromHeight;
            updateSize(
              aspectSize(
                resizeStart.width + lockedWidthDelta,
                lockedAspectRatio,
                minimumWidth,
                minimumHeight
              )
            );
            return;
          }

          updateSize({
            width: Math.max(minimumWidth, resizeStart.width + widthDelta),
            height: Math.max(minimumHeight, resizeStart.height + heightDelta),
          });
        }}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onKeyDown={(event) => {
          const deltas = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -10],
            ArrowDown: [0, 10],
          };
          const delta = deltas[event.key];
          if (!delta || !surfaceRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          const currentWidth = size.width ?? surfaceRef.current.offsetWidth;
          const currentHeight = size.height ?? surfaceRef.current.offsetHeight;
          const nextSize = lockedAspectRatio
            ? aspectSize(
                currentWidth +
                  (delta[0] || delta[1] * lockedAspectRatio),
                lockedAspectRatio,
                minimumWidth,
                minimumHeight
              )
            : {
                width: Math.max(minimumWidth, currentWidth + delta[0]),
                height: Math.max(minimumHeight, currentHeight + delta[1]),
              };
          updateSize(nextSize, true);
          onSizeCommit?.(nextSize);
        }}
      />
    </Block>
  );
}
