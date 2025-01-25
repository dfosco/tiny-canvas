import React, { useRef } from 'react';
import Draggable from 'react-draggable';

function App() {
  const nodeRef = useRef(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#handle"
      defaultPosition={{x: 0, y: 0}}
      position={null}
      grid={[25, 25]}
      scale={1}>
      <div style={{ border: '1px solid #999', padding: '20px' }} ref={nodeRef}>
        <div id="handle" style={{ marginBottom: '10px' }}>
          Drag here
        </div>
        <div>This is the content</div>
      </div>
    </Draggable>
  );
}

export default App;
