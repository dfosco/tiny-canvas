import ResizableBlock from './ResizableBlock';
import MarkdownContent from './MarkdownContent';
import { authorizeCanvasChild } from './canvasChild';

const COLORS = new Set([
  'yellow',
  'blue',
  'green',
  'pink',
  'purple',
  'orange',
]);

function Note({
  children,
  text,
  color = 'yellow',
  width,
  height,
  minWidth = 180,
  minHeight = 60,
  onSizeChange,
  onSizeCommit,
  persistSize,
  className,
  ...blockProps
}) {
  if (!COLORS.has(color)) {
    throw new TypeError(`Unknown Note color: "${color}".`);
  }

  const content = text ?? children ?? '';

  return (
    <ResizableBlock
      {...blockProps}
      componentName="Note"
      resizeLabel="Resize note"
      defaultWidth={270}
      defaultHeight={170}
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
      onSizeChange={onSizeChange}
      onSizeCommit={onSizeCommit}
      persistSize={persistSize}
      className={['tc-note-block', className].filter(Boolean).join(' ')}
    >
      <article className="tc-note" data-color={color}>
        <MarkdownContent className="tc-note-content">{content}</MarkdownContent>
      </article>
    </ResizableBlock>
  );
}

Note.displayName = 'Note';

export default authorizeCanvasChild(Note);
