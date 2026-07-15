import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { reportMetaPlugin } from './vite-report-meta.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), reportMetaPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      // docs/는 app/ 상위(../docs)에 있음 — import.meta.glob이 저장소 루트 docs를 읽을 수 있도록 허용
      allow: ['..'],
    },
  },
})
