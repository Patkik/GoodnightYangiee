import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // CRITICAL: relative base for Android file:// WebView
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Output directly into Android assets folder
    outDir: '../app/src/main/assets',
    emptyOutDir: true,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          spring: ['@react-spring/three'],
          firebase: ['firebase/app', 'firebase/firestore'],
          zustand: ['zustand'],
          gsap: ['gsap'],
        },
      },
    },
    // Mobile-optimized build
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Warn at 600kb per chunk
    chunkSizeWarningLimit: 600,
  },

  // For dev server
  server: {
    port: 3000,
    open: true,
  },
});
