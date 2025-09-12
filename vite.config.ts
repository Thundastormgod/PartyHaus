import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow all connections
    hmr: {
      port: 5173,
      host: 'localhost',
      protocol: 'ws',
      timeout: 30000, // Increase timeout
      overlay: false, // Disable error overlay
    },
    watch: {
      usePolling: true, // Use polling instead of file system events
      interval: 300, // Poll every 300ms
    },
    fs: {
      strict: false, // Allow serving files outside root
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
