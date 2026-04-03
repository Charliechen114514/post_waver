import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Deployed to GitHub Pages at /post_waver/
  base: process.env.NODE_ENV === 'production' ? '/post_waver/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5174
  }
})
