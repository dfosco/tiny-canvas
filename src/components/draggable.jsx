import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import "./draggable.css";
import "../css/globals.css";
import { findDragId, refreshStorage, getQueue, saveDrag } from '../templates/utils';

// Pull value from --golden-number in globals.css, trim `px` from the end, and save it as a int in a const
const golden = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--golden-number')) / 2;

function Draggable({ children }) {

  // Set up references for the draggable element and pull data from localStorage
  const draggableRef = useRef(null);
  const dragId = useRef(findDragId(children)).current;
  const queue = useRef(getQueue(dragId)).current;

  // Function to check if element has a valid dragId
  const hasValidId = (id) => id !== null && id !== undefined;
  
  // Add new effect for on-translation class
  const translation_ms = 250;
  const [onTranslation, setOnTranslation] = useState(false);

  // On page load, apply class .on-translation to all draggables and remove it after 150ms (coming from a variable)
  useEffect(() => {
    document.documentElement.style.setProperty('--translation_ms', `${translation_ms}ms`);
    const draggableEl = draggableRef.current;

    // Only apply transition if dragId exists and has saved coordinates
    if (draggableEl && hasValidId(dragId) && queue && (queue.x !== 0 || queue.y !== 0)) {
      draggableEl.classList.add('on-translation');
      setOnTranslation(true);

      const timer = setTimeout(() => {
        draggableEl.classList.remove('on-translation');
        setOnTranslation(false);
      }, translation_ms*4);

      return () => clearTimeout(timer);
    }
  }, []);
  
  // Apply saved coordinates from localStorage to the draggable elements on page load
  useEffect(() => {
    refreshStorage();
    if (draggableRef.current && queue) {
      setPosition({ x: queue.x, y: queue.y }); 
    }
    console.log("position", position);

  }, [queue]);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Get the main element and check for data-hasGrid attribute
  const mainElement = document.querySelector('main');
  const checkGrid = mainElement?.getAttribute('data-hasGrid') === 'true';
  const hasGrid = checkGrid ? [golden, golden] : undefined;

  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    grid: hasGrid, // Use grid only if data-hasGrid is present
    bounds: 'body',
    threshold: { delay: 30, distance: 4 },
    defaultClass: 'drag',
    defaultClassDragging: 'on',
    defaultClassDragged: 'off',
    applyUserSelectHack: true,
    position: { x: position.x, y: position.y },
    onDrag: ({ offsetX, offsetY }) => setPosition({ x: offsetX, y: offsetY }),
    onDragEnd: (data) => {
      if (dragId === null) { return } 
      else {
        setPosition({ x: data.offsetX, y: data.offsetY }); 
        saveDrag(dragId, data.offsetX, data.offsetY);
        console.log('DragEnd to:', position);
      }
    }
  });

  // Rotate draggable element randomly between -2 and 2 degrees on each drag
  const [rotationVariations, setRotationVariations] = useState(Math.random() < 0.5 ? -2 : 2);
  const rotation = (isDragging || onTranslation) ? `${rotationVariations}deg` : '0deg';

  useEffect(() => {
    const newRotation = Math.random() < 0.5 ? -2 : 2;
    setRotationVariations(newRotation);
  }, [isDragging]);
  document.documentElement.style.setProperty('--rotation', `${rotation}`);
  
  return (
    <article 
      ref={draggableRef} 
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="draggable" style={{ transform: (isDragging || onTranslation) && `rotate(${rotation})`, translation: 'transform ease-in-out 150ms' }}>
        {children}
      </div>
    </article>
  );
}

export default Draggable;
