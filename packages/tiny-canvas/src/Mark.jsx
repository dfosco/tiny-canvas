import ResizableBlock from './ResizableBlock';
import MarkdownContent from './MarkdownContent';
import { authorizeCanvasChild } from './canvasChild';

function Mark({
  children,
  content,
  width,
  height,
  minWidth = 200,
  minHeight = 60,
  onSizeChange,
  onSizeCommit,
  persistSize,
  className,
  ...blockProps
}) {
  const markdown = content ?? children ?? '';

  return (
    <ResizableBlock
      {...blockProps}
      componentName="Mark"
      resizeLabel="Resize markdown"
      defaultWidth={530}
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
      onSizeChange={onSizeChange}
      onSizeCommit={onSizeCommit}
      persistSize={persistSize}
      className={['tc-mark-block', className].filter(Boolean).join(' ')}
    >
      <article className="tc-mark">
        <MarkdownContent className="tc-mark-content">{markdown}</MarkdownContent>
      </article>
    </ResizableBlock>
  );
}

Mark.displayName = 'Mark';

export default authorizeCanvasChild(Mark);
