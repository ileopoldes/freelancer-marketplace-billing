/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts", // Main server file
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 10000,
  verbose: true,
  moduleNameMapper: {
    "^@marketplace/shared$": "<rootDir>/../../packages/shared/dist/index.js",
    "^@marketplace/shared/(.*)$": "<rootDir>/../../packages/shared/dist/$1",
  },
  // Handle Prisma client
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
