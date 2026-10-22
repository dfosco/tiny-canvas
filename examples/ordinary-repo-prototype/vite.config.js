import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tinyCanvas from '@dfosco/tiny-canvas/vite';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    react(),
    tailwindcss(),
    tinyCanvas({
      routeBase: '/canvas',
      documentsPath: 'src/hyperbase/canvas',
    }),
  ],
});
