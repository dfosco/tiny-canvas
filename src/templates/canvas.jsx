import React from 'react';
  
function Canvas(props) {
  return (
    <main>
      <div className="canvas">
        {props.children}  
      </div>
    </main>
  );
}

export default Canvas;
