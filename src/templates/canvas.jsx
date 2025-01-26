import { useRef } from 'react';
import { useDraggable } from '@neodrag/react';

function Canvas(props) {
  const draggableRef = useRef(null);
  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    grid: [10, 10],
    onDragStart: (data) => {
      console.log('Started dragging:', data);
    },
    onDragEnd: (data) => {
      console.log('Finished dragging:', data);
    }
  });

  return (
    <main>
      <div className="canvas">
        <article ref={draggableRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          {props.children}
        </article>
      </div>
    </main>
  );
}

export default Canvas;
