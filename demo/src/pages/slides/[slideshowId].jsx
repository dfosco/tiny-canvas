import { Slides } from '@dfosco/tiny-canvas'
import { useParams, useSearchParams } from 'react-router-dom'
import { createDemoDeck } from '../../slides/demoDeck'

export default function SlidesDeckPage() {
  const { slideshowId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const deck = createDemoDeck(import.meta.env.BASE_URL)

  if (slideshowId !== deck.id) {
    throw new Error(`Slides deck "${slideshowId}" was not found.`)
  }

  const slideIndex = Math.max(Number(searchParams.get('slide') || 1) - 1, 0)
  const stepValue = Number(searchParams.get('step'))
  const stepIndex = Number.isFinite(stepValue) && stepValue > 0 ? stepValue : undefined

  return (
    <Slides
      deck={deck}
      slideIndex={slideIndex}
      stepIndex={stepIndex}
      onSlideChange={(nextSlideIndex) => {
        const next = new URLSearchParams()
        next.set('slide', String(nextSlideIndex + 1))
        setSearchParams(next, { replace: false })
      }}
      onStepChange={(nextStepIndex) => {
        const next = new URLSearchParams(searchParams)
        next.set('slide', String(slideIndex + 1))
        if (nextStepIndex) next.set('step', String(nextStepIndex))
        else next.delete('step')
        setSearchParams(next, { replace: true })
      }}
    />
  )
}
