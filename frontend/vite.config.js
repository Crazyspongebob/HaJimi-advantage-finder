import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置，代理后端 API 请求
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    proxy: {
      // 将 /api 开头的请求代理到后端服务
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
