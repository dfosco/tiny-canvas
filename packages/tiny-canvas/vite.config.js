import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        'tiny-canvas': resolve(__dirname, 'src/index.js'),
        'canvas-document': resolve(__dirname, 'src/canvasDocument.jsx'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'tiny-canvas',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-markdown',
        '@dfosco/hypercanvas/canvas/materializer',
      ],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
