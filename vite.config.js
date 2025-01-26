import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generouted from '@generouted/react-router/plugin'
import mdx from '@mdx-js/rollup'

export default defineConfig({ 
  plugins: [
    react(),
    mdx(),
    generouted({
      // Configure route generation for MDX files
      routesConfig: {
        files: '**/*.{jsx,mdx}'
        // pathOverrides: {
          // 'src/boards/*.mdx': '/board/:path',
          // 'src/pages/*.jsx': '/:path'
        // } 
      }
    })
  ],
  server: { port: 1234 }
})