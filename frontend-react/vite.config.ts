/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs';
import { resolve } from 'path';
import obfuscator from 'vite-plugin-javascript-obfuscator';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname);
  console.log('Vite Config Mode:', mode);
  console.log('Vite Config Env VITE_GOOGLE_CLIENT_ID:', env.VITE_GOOGLE_CLIENT_ID);

  return {
    plugins: [
      react(),
      mode === 'production' ? obfuscator({
        options: {
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: true,
          numbersToExpressions: true,
          simplify: true,
          stringArrayShuffle: true,
        },
      }) : null,
    ].filter(Boolean) as any,
    root: '.',
    define: {
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    server: {
      host: true,
      port: 5000,
    },
    preview: {
      port: 5000,
      host: '0.0.0.0',
    },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          privacy: resolve(__dirname, 'privacy.html'),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
})
