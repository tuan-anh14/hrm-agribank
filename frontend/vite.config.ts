import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPath from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPath()],
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "sass:math" as *;'
      }
    }
  }
})
