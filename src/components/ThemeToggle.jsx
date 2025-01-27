import { useTheme } from '@primer/react'
import { Button } from '@primer/react'
import { SunIcon, MoonIcon } from '@primer/octicons-react'
import { useEffect } from 'react'

export function ThemeToggle() {
  const {colorMode, setColorMode} = useTheme()
  
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      setColorMode(storedTheme)
    }
  }, [setColorMode])

  const toggleTheme = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light'
    setColorMode(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <Button leadingVisual={colorMode === 'light' ? MoonIcon : SunIcon} onClick={toggleTheme}>
      Switch to {colorMode === 'light' ? 'dark' : 'light'} mode
    </Button>
  )
}