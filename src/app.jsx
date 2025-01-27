import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/reset.css'
import './css/globals.css'
import { routes } from '@generouted/react-router'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider, BaseStyles } from '@primer/react'

const Routes = () => <RouterProvider router={createBrowserRouter(routes, { basename: '/storyboard' })} />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider colorMode="light">
      <BaseStyles>
        <Routes />
      </BaseStyles>
    </ThemeProvider>
  </StrictMode>
)