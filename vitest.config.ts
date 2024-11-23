/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname)
      },
      {
        find: '@/components',
        replacement: resolve(__dirname, './components')
      },
      {
        find: '@/utils',
        replacement: resolve(__dirname, './utils')
      },
      {
        find: '@/hooks',
        replacement: resolve(__dirname, './hooks')
      },
      {
        find: '@/types',
        replacement: resolve(__dirname, './types')
      }
    ]
  }
});
