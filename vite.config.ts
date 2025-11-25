import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Server Configuration
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      open: false,
    },
    
    // Preview (production preview)
    preview: {
      port: 3001,
      host: '0.0.0.0',
    },
    
    // Plugins
    plugins: [
      react({
        // Fast Refresh
        fastRefresh: true,
      }),
      tailwindcss(),
    ],
    
    // Environment Variables
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    // Path Resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/context': path.resolve(__dirname, './src/context'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      },
    },
    
    // Build Configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'esbuild',
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core vendor chunk
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor';
              }
              if (id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'ui';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('@google')) {
                return 'google-ai';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'export';
              }
              if (id.includes('dompurify')) {
                return 'security';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    
    // Optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
    },
  };
});
