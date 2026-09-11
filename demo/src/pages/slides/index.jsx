import { Navigate } from 'react-router-dom'

export default function SlidesIndexPage() {
  return <Navigate to="statefully-review?slide=1" replace />
}
