import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy /rest/v1 to local PostgREST (for development)
      '/rest/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rest\/v1/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'visualization': ['recharts', 'reactflow', '@tremor/react'],
          'ui-libs': ['framer-motion', 'lucide-react', 'date-fns'],
          'postgrest-client': ['postgrest-client'] // PostgREST-compatible client
        }
      }
    }
  }
});

