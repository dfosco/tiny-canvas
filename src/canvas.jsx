import React, { useRef, useState } from 'react';

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

function App(props) {
  const draggable1Ref = useRef(null);
  const draggable2Ref = useRef(null);
  const [positions, setPositions] = useState({
    drag1: { x: 0, y: 0 },
    drag2: { x: 0, y: 0 }
  });

  const handleStop = (id, ref, otherRef) => (e, data) => {
    const rect1 = ref.current.getBoundingClientRect();
    const rect2 = otherRef.current.getBoundingClientRect();

    if (checkCollision(rect1, rect2)) {
      const newPos = findNearestValidPosition(rect1, rect2);
      setPositions(prev => ({
        ...prev,
        [id]: { x: newPos.x, y: data.y }
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
          {props.children}
      </div>
    </main>
  );
}

export default App;
