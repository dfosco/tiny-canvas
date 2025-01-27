import { Children } from 'react';
import Draggable from '../components/draggable';
import styles from "./canvas.module.css";

function Canvas({ children, centered = true, grid = false }) {

  const centeredMode = centered ? {display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center'} : null;

  return (
    <main className={styles.canvas} style={centeredMode} data-hasGrid={grid}>
          {Children.map(children, (child, index) => (
            <Draggable key={index}>
              {child}
            </Draggable>
          ))}
    </main>
  );
}

export default Canvas;
