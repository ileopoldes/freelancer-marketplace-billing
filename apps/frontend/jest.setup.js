// Jest setup file for frontend tests
require('@testing-library/jest-dom');

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true),
});
