import { useRef } from 'react'
import Draggable from 'react-draggable'

function Drag({ children, position, onStop, grid }) {
  const nodeRef = useRef(null)
  
  return (
    <Draggable
      nodeRef={nodeRef}
      grid={grid}
      handle=".draggable"
      bounds=".canvas"
      defaultClassName="draggable"
      defaultClassNameDragging="draggable-on"
      defaultClassNameDragged="draggable-off"
      position={position}
      onStop={onStop}>
      <article ref={nodeRef} className="bg-white border p-4">
        {children}
      </article>
    </Draggable>
  )
}

export default Drag