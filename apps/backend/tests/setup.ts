// Jest setup file for backend tests
// PrismaClient is used for type definitions only
// import { PrismaClient } from "@prisma/client";
import "./test-utils";

// Configure test environment
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities (compatible with existing code)
(global as any).testUtils = {
  // Helper to create test dates consistently
  createTestDate: (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day); // month is 0-indexed
  },

  // Helper to format dates for comparison
  formatDate: (date: Date) => {
    return date.toISOString().split("T")[0];
  },
};

// Extend Jest matchers for date comparisons (compatible with existing code)
expect.extend({
  toBeWithinSeconds(received: Date, expected: Date, seconds: number = 1) {
    const diff = Math.abs(received.getTime() - expected.getTime());
    const pass = diff <= seconds * 1000;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within ${seconds} seconds of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within ${seconds} seconds of ${expected}`,
        pass: false,
      };
    }
  },
});

// Set up global test environment
beforeAll(() => {
  // Increase timeout for slower tests
  jest.setTimeout(30000);
});

beforeEach(() => {
  // Clear all timers before each test
  jest.clearAllTimers();

  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

afterAll(() => {
  // Clean up after all tests
  jest.clearAllTimers();
});

// Type declarations for global utilities
// Global testUtils will be available at runtime
