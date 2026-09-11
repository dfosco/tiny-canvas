import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generouted from '@generouted/react-router/plugin'
import mdx from '@mdx-js/rollup'
import tinyCanvas from '@dfosco/tiny-canvas/vite'
import prototypeData from '@dfosco/statefully/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({ 
  base: '/tiny-canvas/',
  resolve: {
    alias: [
      {
        find: '@dfosco/tiny-canvas/style.css',
        replacement: fileURLToPath(
          new URL('../packages/tiny-canvas/src/style.css', import.meta.url)
        )
      },
      {
        find: '@dfosco/tiny-canvas',
        replacement: fileURLToPath(
          new URL('../packages/tiny-canvas/src/index.js', import.meta.url)
        )
      }
    ]
  },
  optimizeDeps: {
    exclude: ['@dfosco/statefully'],
  },
  plugins: [
    prototypeData(),
    react(),
    mdx(),
    tinyCanvas({
      routeBase: '/canvas',
    }),
    generouted({
      // Configure route generation for MDX files
      routesConfig: {
        files: '**/*.{jsx,tsx,mdx}'
        // pathOverrides: {
          // 'src/boards/*.mdx': '/board/:path',
          // 'src/pages/*.jsx': '/:path'
        // } 
      }
    })
  ],
  server: {
    port: 1234,
    strictPort: true,
  }
})
