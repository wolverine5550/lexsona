import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Setup window properties that might be missing in JSDOM
beforeAll(() => {
  // Suppress console errors during tests
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Mock window properties
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Set up global error handlers
  const originalError = global.console.error;
  global.console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error: Uncaught [Error: Test error]')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Clean up after each test
afterEach(() => {
  cleanup(); // Clean up React components
  vi.clearAllMocks();
});

// Add missing TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
