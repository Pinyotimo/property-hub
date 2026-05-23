import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8001",
      "/media": "http://127.0.0.1:8001",
      "/static": "http://127.0.0.1:8001",
      "/admin": "http://127.0.0.1:8001",
      "/ws": {
        target: "ws://127.0.0.1:8001",
        ws: true,
      },
    },
  },
  build: {
    outDir: "../static/frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
