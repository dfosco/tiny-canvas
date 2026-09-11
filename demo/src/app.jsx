import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'virtual:prototype-data'
import './css/reset.css'
import './css/globals.css'
import { routes } from '@generouted/react-router'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter(routes, { basename: '/tiny-canvas' })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
