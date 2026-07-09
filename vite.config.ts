import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Read package metadata
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Generate formatted build date (YYYY-MM-DD HH:MM)
const date = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const formattedBuildDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.2.0'),
    __BUILD_DATE__: JSON.stringify(formattedBuildDate),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-recharts';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
})
