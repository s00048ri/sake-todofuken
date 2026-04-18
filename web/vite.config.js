import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages では /sake-todofuken/ というサブパスで配信されるため、
// 環境変数 BASE_URL で切り替える（npm run build 時に設定）
const base = process.env.BASE_URL || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
