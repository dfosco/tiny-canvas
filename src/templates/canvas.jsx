import { useRef, Children, cloneElement } from 'react';
import { useDraggable } from '@neodrag/react';
import "../css/canvas.css";

function DraggableWrapper({ children }) {
  const draggableRef = useRef(null);
  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    // grid: [10, 10],
    bounds: 'body',
    threshold: { delay: 30, distance: 4 },
    defaultClass: 'drag',
    defaultClassDragging: 'on',
    defaultPosition: { x: 0, y: 0 },
    onDragStart: (data) => {
      console.log('Started dragging:', data);
    },
    onDragEnd: (data) => {
      console.log('Finished dragging:', data);
    }
  });

  // const rotation = Math.random() * 4 - 2;;
  const rotationVariations = useRef(Math.random() * 4 - 2).current;
  const rotation = isDragging ? `${rotationVariations}deg` : '0deg';
  
  return (
    <article 
      ref={draggableRef} 
      style={{  cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="draggable" style={{ transform: isDragging && `rotate(${rotation})`, transition: 'transform ease-in-out 150ms' }}>
        {children}
      </div>
    </article>
  );
}

function Canvas({ children }) {
  return (
    <main className="canvas">
          {Children.map(children, (child, index) => (
            <DraggableWrapper key={index}>
              {child}
            </DraggableWrapper>
          ))}
    </main>
  );
}

export default Canvas;
