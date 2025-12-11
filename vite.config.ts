import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 1. prevent vite from obscuring rust errors
  clearScreen: false,

  // 2. Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri` and `src-main`
      ignored: ["**/src-tauri/**", "**/src-main/**"],
    },
  },

  // Expose environment variables prefixed with these in Tauri's source code via `import.meta.env`
  envPrefix: ["VITE_", "TAURI_ENV_*"],

  // Build configuration for Tauri
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    // Don't minify for debug builds
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    // Generate sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
