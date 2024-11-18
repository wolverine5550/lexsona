import { defineConfig } from 'vitest/config';
import path from 'path';

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
        replacement: path.resolve(__dirname)
      },
      {
        find: '@/components',
        replacement: path.resolve(__dirname, './components')
      },
      {
        find: '@/utils',
        replacement: path.resolve(__dirname, './utils')
      },
      {
        find: '@/hooks',
        replacement: path.resolve(__dirname, './hooks')
      },
      {
        find: '@/types',
        replacement: path.resolve(__dirname, './types')
      }
    ]
  }
});
