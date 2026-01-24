import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const sourcemaps = env.VITE_SOURCEMAPS === 'true';

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      isDev && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Output directory
      outDir: 'dist',
      
      // Generate sourcemaps for production debugging (configurable)
      sourcemap: sourcemaps,
      
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Rollup options for code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
            ],
            'query-vendor': ['@tanstack/react-query'],
            'auth-vendor': ['keycloak-js', '@react-keycloak/web'],
            'chart-vendor': ['recharts'],
          },
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            let extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              extType = 'fonts';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      // Optimize CSS
      cssCodeSplit: true,
      cssMinify: true,
    },
    
    // Preview server config (for testing production builds)
    preview: {
      port: 4173,
      host: true,
    },
  };
});
