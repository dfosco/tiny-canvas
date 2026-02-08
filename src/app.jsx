import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/reset.css'
import './css/globals.css'
import '@primer/react-brand/lib/css/main.css'
import { routes } from '@generouted/react-router'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider, BaseStyles } from '@primer/react'

const getInitialTheme = () => {
  try {
    const storedTheme = localStorage.getItem('theme')
    return storedTheme || 'light'
  } catch {
    return 'light'
  }
}

const Routes = () => <RouterProvider router={createBrowserRouter(routes, { basename: '/tiny-canvas' })} />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider colorMode={getInitialTheme()} preventSSRMismatch>
      <BaseStyles>
        <Routes />
      </BaseStyles>
    </ThemeProvider>
  </StrictMode>
)