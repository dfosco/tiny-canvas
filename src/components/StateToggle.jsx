import { Button } from '@primer/react-brand'
import { IssueReopenedIcon } from '@primer/octicons-react'

export function StateToggle() {
  const handleReset = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <Button 
      variant="primary"
      leadingVisual={<IssueReopenedIcon/>} 
      onClick={handleReset}
      hasArrow={false}
    >
      Reset all changes
    </Button>
  )
}