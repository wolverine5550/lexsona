/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environmentMatchGlobs: [
      ['**/__tests__/integration/api-*.test.ts', 'node'],
      ['**/__tests__/**/*', 'jsdom']
    ],
    globals: true,
    setupFiles: './vitest.setup.ts',
    testTimeout: 10000,
    sequence: {
      concurrent: false
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
});
