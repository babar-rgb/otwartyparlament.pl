import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {

  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'visualization': ['recharts', 'reactflow', '@tremor/react'],
          'ui-libs': ['framer-motion', 'lucide-react', 'date-fns']
        }
      }
    }
  }
});

