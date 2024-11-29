import { afterEach, beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { setupCommonMocks } from './__tests__/setup/commonMocks';

// Set up common mocks for all tests
beforeAll(() => {
  setupCommonMocks();
});

// Clean up after each test
afterEach(() => {
  cleanup(); // Clean up React components
  vi.clearAllMocks(); // Clear all mocks
  vi.resetModules(); // Reset modules

  // Reset any global variables
  global.localStorage?.clear();
  global.sessionStorage?.clear();

  // Reset any environment variables
  process.env = { ...process.env };
});
