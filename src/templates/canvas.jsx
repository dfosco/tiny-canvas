import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable'

// get value from var(--golden-number) in styles.css and make it available as a int to the component
const golden = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--golden-number').replace('px', ''));

function checkCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}

function findNearestValidPosition(rect1, rect2, grid = [golden, golden]) {
  const [gridX, gridY] = grid;
  let newX = rect1.left;
  let newY = rect1.top;

  // Move right if colliding
  if (checkCollision(rect1, rect2)) {
    newX = rect2.right;
    // Snap to grid
    newX = Math.round(newX / gridX) * gridX;
  }

  return { x: newX, y: newY };
}

function Canvas(props) {
  const draggable1Ref = useRef(null);
  const draggable2Ref = useRef(null);
  const [positions, setPositions] = useState({
    drag1: { x: 0, y: 0 },
    drag2: { x: 0, y: 0 }
  });

  const handleStop = (id, currentRef, otherRef) => (e, data) => {
    // First check if refs are valid
    if (!currentRef.current || !otherRef.current) {
      setPositions(prev => ({
        ...prev,
        [id]: { x: data.x, y: data.y }
      }));
      return;
    }
  
    const current = currentRef.current.getBoundingClientRect();
    const other = otherRef.current.getBoundingClientRect();
  
    // Check for collision
    if (current.right > other.left && 
        current.left < other.right && 
        current.bottom > other.top && 
        current.top < other.bottom) {
      const newPos = { 
        x: data.x - 100, // Move left if collision
        y: data.y 
      };
      
      setPositions(prev => ({
        ...prev,
        [id]: { x: newPos.x, y: newPos.y }
      }));
    } else {
      setPositions(prev => ({
        ...prev,
        [id]: { x: data.x, y: data.y }
      }));
    }
  };

  return (
    <main>
      <div className="canvas">
          <Draggable
          nodeRef={draggable1Ref}
          grid={[golden, golden]}
          handle=".draggable"
          bounds=".canvas"
          defaultClassNameDragged="draggable-off"
          defaultClassNameDragging="draggable-on"
          defaultClassName="draggable"
          position={positions.drag1}
          onStop={handleStop('drag1', draggable1Ref, draggable2Ref)}>
          <article ref={draggable1Ref} style={{ border: '1px solid #999', padding: '20px', backgroundColor: 'white' }}>
            <div id="handle">Drag here</div>
            <div>Draggable 1</div>
          </article>
        </Draggable>
        {props.children}
      </div>
    </main>
  );
}

export default Canvas;
