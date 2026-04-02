import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/post_waver/', // GitHub Pages 仓库名
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 代理 API 请求到后端服务器
      '/post_waver/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/post_waver\/api/, '/api')
      },
      // 为了兼容性，也代理直接访问的 /api
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
