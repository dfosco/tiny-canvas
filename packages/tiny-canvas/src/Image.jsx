import { useState } from 'react';
import ResizableBlock from './ResizableBlock';
import { authorizeCanvasChild } from './canvasChild';

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;

function Image({
  src,
  alt = '',
  width,
  height,
  minWidth = 100,
  minHeight = 60,
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  onSizeChange,
  onSizeCommit,
  persistSize,
  className,
  ...blockProps
}) {
  if (typeof src !== 'string' || src.trim() === '') {
    throw new TypeError('Image src must be a non-empty string.');
  }
  if (typeof alt !== 'string') {
    throw new TypeError('Image alt must be a string.');
  }

  const initialWidth = width ?? DEFAULT_WIDTH;
  const initialHeight = height ?? DEFAULT_HEIGHT;
  const [naturalRatio, setNaturalRatio] = useState(null);
  const aspectRatio = naturalRatio ?? initialWidth / initialHeight;

  return (
    <ResizableBlock
      {...blockProps}
      componentName="Image"
      resizeLabel={alt ? `Resize image: ${alt}` : 'Resize image'}
      defaultWidth={DEFAULT_WIDTH}
      defaultHeight={DEFAULT_HEIGHT}
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
      aspectRatio={aspectRatio}
      onSizeChange={onSizeChange}
      onSizeCommit={onSizeCommit}
      persistSize={persistSize}
      className={['tc-image-block', className].filter(Boolean).join(' ')}
    >
      <figure className="tc-image">
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          draggable={false}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) {
              setNaturalRatio(image.naturalWidth / image.naturalHeight);
            }
            onLoad?.(event);
          }}
          onError={onError}
        />
      </figure>
    </ResizableBlock>
  );
}

Image.displayName = 'Image';

export default authorizeCanvasChild(Image);
