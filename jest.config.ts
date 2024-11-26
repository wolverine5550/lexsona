import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Path to Next.js app to load next.config.js and .env files
  dir: './'
});

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};

export default createJestConfig(config);
