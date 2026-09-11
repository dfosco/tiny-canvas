import { Canvas, Frame, Note } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'

export default function StatefulCanvasPage() {
  return (
    <Canvas
      title="Stateful review"
      dotted
      canvasWidth={1500}
      canvasHeight={1100}
      resettable
    >
      <Frame
        id="stateful-review-frame"
        route="/tiny-canvas/stateful?flow=focused#view=details&showActivity=true"
        title="Statefully review"
        description="Details with activity visible"
        element="stateful-activity-panel"
        offset={24}
        x={48}
        y={48}
        width={1100}
        height={700}
        snapshot="/tiny-canvas/snapshots/stateful/stateful-review-frame.png"
        snapshotDark="/tiny-canvas/snapshots/stateful/stateful-review-frame-dark.png"
        loadStrategy="interaction"
      />
      <Note id="stateful-review-note" x={1180} y={48} width={250} height={190}>
        {'## Stateful frame\n\nThis frame restores an exact screen and scroll target from its URL and props.'}
      </Note>
    </Canvas>
  )
}
