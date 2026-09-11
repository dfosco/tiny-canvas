import { useEffect } from 'react'
import {
  PrototypeProvider,
  useFlowData,
  useOverride,
  useRecords,
} from '@dfosco/statefully/react'
import { useSearchParams } from 'react-router-dom'

function StatefulReview() {
  const flow = useFlowData()
  const reviews = useRecords('reviews')
  const [view, setView] = useOverride('view', flow.view ?? 'overview')
  const [showActivity, setShowActivity] = useOverride(
    'showActivity',
    flow.showActivity ?? true
  )
  const details = view === 'details'
  const activityVisible = showActivity !== false && showActivity !== 'false'

  return (
    <main className="stateful-demo">
      <header className="stateful-demo-header">
        <div>
          <span>{flow.eyebrow}</span>
          <h1>{flow.title}</h1>
          <p>{flow.summary}</p>
        </div>
        <div className="stateful-demo-actions" id="stateful-view-toggle">
          <button
            type="button"
            data-active={!details || undefined}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            data-active={details || undefined}
            onClick={() => setView('details')}
          >
            Details
          </button>
        </div>
      </header>

      <section className="stateful-demo-grid" id="stateful-review-list">
        {reviews.map((review) => (
          <article key={review.id}>
            <div>
              <h2>{review.title}</h2>
              <span>{review.status}</span>
            </div>
            <p>{review.description}</p>
            {details ? (
              <small>
                State ID: <code>{review.id}</code>
              </small>
            ) : null}
          </article>
        ))}
      </section>

      <section className="stateful-demo-activity" id="stateful-activity-panel">
        <div>
          <h2>Recent activity</h2>
          <p>Show or hide this panel and share the exact result through the URL.</p>
        </div>
        <button
          type="button"
          aria-pressed={activityVisible}
          onClick={() => setShowActivity(!activityVisible)}
        >
          {activityVisible ? 'Hide activity' : 'Show activity'}
        </button>
        {activityVisible ? (
          <ol>
            <li>Snapshot capture verified</li>
            <li>Stateful link copied</li>
            <li>Slide target aligned</li>
          </ol>
        ) : null}
      </section>
    </main>
  )
}

export default function StatefulDemoPage() {
  const [searchParams] = useSearchParams()
  const requestedFlow = searchParams.get('flow')
  const flow = requestedFlow === 'focused' ? 'SlidesDemo/focused' : 'SlidesDemo/default'

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Statefully review — Tiny Canvas'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <PrototypeProvider flow={flow} prototype="SlidesDemo">
      <StatefulReview />
    </PrototypeProvider>
  )
}
