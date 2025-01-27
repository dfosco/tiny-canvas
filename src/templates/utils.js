import React from 'react';

// Recursively searches through React component children
// Returns the dragId prop value if found, null if not
export const findDragId = (children) => {
  if (!children) return null;
  
  let dragId = null;
  const checkProps = (element) => {
    if (element.props && element.props.id) {
      dragId = element.props.id;
      return;
    }
    if (element.props && element.props.children) {
      React.Children.forEach(element.props.children, checkProps);
    }
  };
  
  checkProps(children);
  return dragId;
};

// Gets stored coordinates for a specific dragId from localStorage
// Returns coords object with x,y or default {x:0, y:0} if not found
export const getQueue = (dragId) => {
  try {
    const queue = JSON.parse(localStorage.getItem('queue')) || [];
    const coordsMap = queue.reduce((map, item) => {
      map[item.id] = { id: item.id, x: item.x, y: item.y };
      return map;
    }, {});

    return coordsMap[dragId] || { x: 0, y: 0 };
  } catch (error) {
    console.error('Error getting saved coordinates:', error);
    return { x: 0, y: 0 };
  }
};

// Checks if queue exists in localStorage on page load
// Creates empty queue array if none exists
export const refreshStorage = () => {
  try {
    const queue = localStorage.getItem('queue');
    if (!queue) {
      localStorage.setItem('queue', JSON.stringify([]));
    }
  } catch (error) {
    console.error('LocalStorage is not available:', error);
  }
};

// Updates or creates position data for a draggable element
// Stores x,y coordinates and timestamp in localStorage queue
export const saveDrag = (dragId, x, y) => {
  try {
    const queue = JSON.parse(localStorage.getItem('queue')) || [];
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    
    const dragData = {
      id: dragId,
      x: x,
      y: y,
      time: now,
    };

    const existingIndex = queue.findIndex(item => item.id === dragId);
    
    if (existingIndex >= 0) {
      queue[existingIndex] = dragData;
    } else {
      queue.push(dragData);
    }

    localStorage.setItem('queue', JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving drag position:', error);
  }
};