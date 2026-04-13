import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/v2/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['react-is', 'recharts'],
  },
})
