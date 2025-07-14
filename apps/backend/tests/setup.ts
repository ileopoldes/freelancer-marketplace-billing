// Jest setup file for backend tests
import { PrismaClient } from "@prisma/client";

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

// Global test utilities
global.testUtils = {
  // Helper to create test dates consistently
  createTestDate: (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day); // month is 0-indexed
  },

  // Helper to format dates for comparison
  formatDate: (date: Date) => {
    return date.toISOString().split("T")[0];
  },
};

// Extend Jest matchers for date comparisons
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

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

// Type declarations for global utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeWithinSeconds(expected: Date, seconds?: number): R;
    }
  }

  var testUtils: {
    createTestDate: (year: number, month: number, day: number) => Date;
    formatDate: (date: Date) => string;
  };
}
