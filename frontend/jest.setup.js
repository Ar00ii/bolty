import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
process.env.NEXT_PUBLIC_WS_URL = 'http://localhost:3001';

// Suppress console errors in tests (optionally)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
