import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    publicDir: 'assets',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/data/initialData')) return 'initial-data';
            if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) return 'react-vendor';
            if (id.includes('/node_modules/recharts') || id.includes('/node_modules/d3-')) return 'charts-vendor';
            if (id.includes('/node_modules/lucide-react')) return 'icons-vendor';
            if (id.includes('/node_modules/motion')) return 'motion-vendor';
          },
        },
      },
    },
    test: {
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'lcov'],
        include: ['src/server/{api,app,health,logger,metrics,mfa,password,passwordReset}.ts'],
        thresholds: {
          lines: 90,
          statements: 60,
          functions: 60,
          branches: 40,
        },
      },
    },
  };
});
