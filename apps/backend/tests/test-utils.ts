import { Money, createMoney } from "@marketplace/shared";

/**
 * Test utilities for the billing system
 */
export const testUtils = {
  /**
   * Create a test date with specified year, month, and day
   */
  createTestDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day); // month is 0-indexed
  },

  /**
   * Format date as YYYY-MM-DD string
   */
  formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  },

  /**
   * Create a mock Prisma client with common methods
   */
  createMockPrisma(): Record<string, any> {
    return {
      contract: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      customer: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      invoiceLine: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      usageEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      billingJob: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      credit: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      creditPackage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entityCreditBalance: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entityUser: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      entitySubscription: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      marketplaceEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organization: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entity: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      team: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
    };
  },

  /**
   * Create a mock contract with sensible defaults
   */
  createMockContract(
    overrides: Partial<Record<string, any>> = {},
  ): Record<string, any> {
    return {
      id: "contract_1",
      customerId: "customer_1",
      baseFee: "99.0000",
      minCommitCalls: 10000,
      callOverageFee: "0.0020",
      discountRate: "0.2000",
      billingCycle: 1,
      nextBillingDate: new Date("2025-01-01"),
      status: "ACTIVE",
      customer: {
        id: "customer_1",
        name: "Test Customer",
        email: "test@example.com",
        creditBalance: "0.0000",
      },
      ...overrides,
    };
  },

  /**
   * Create a mock marketplace event
   */
  createMockMarketplaceEvent(
    overrides: Partial<Record<string, any>> = {},
  ): Record<string, any> {
    return {
      id: "event_1",
      entityId: "entity_1",
      userId: "user_1",
      eventType: "project_posted",
      quantity: 1,
      unitPrice: 10.0,
      timestamp: new Date(),
      metadata: {},
      ...overrides,
    };
  },

  /**
   * Create a mock entity credit balance
   */
  createMockEntityCreditBalance(
    overrides: Partial<Record<string, any>> = {},
  ): Record<string, any> {
    return {
      id: "balance_1",
      entityId: "entity_1",
      totalCredits: 100.0,
      usedCredits: 30.0,
      ...overrides,
    };
  },

  /**
   * Create a mock entity subscription
   */
  createMockEntitySubscription(overrides: Partial<any> = {}): any {
    return {
      id: "subscription_1",
      entityId: "entity_1",
      subscriptionType: "MONTHLY",
      seatCount: 10,
      monthlyPrice: 500.0,
      annualPrice: 0,
      billingCycle: "MONTHLY",
      status: "ACTIVE",
      nextBillingDate: new Date("2025-02-01"),
      ...overrides,
    };
  },

  /**
   * Create a mock entity user
   */
  createMockEntityUser(
    overrides: Partial<Record<string, any>> = {},
  ): Record<string, any> {
    return {
      id: "entityuser_1",
      entityId: "entity_1",
      userId: "user_1",
      role: "MEMBER",
      creditLimit: 50.0,
      status: "ACTIVE",
      ...overrides,
    };
  },

  /**
   * Generate an array of mock data
   */
  generateMockArray<T>(count: number, factory: (index: number) => T): T[] {
    return Array.from({ length: count }, (_, index) => factory(index));
  },

  /**
   * Sleep for testing async operations
   */
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Create a date range for testing
   */
  createDateRange(startDate: Date, days: number): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  },

  /**
   * Mock a successful async operation
   */
  mockSuccess<T>(value: T): jest.Mock<Promise<T>> {
    return jest.fn().mockResolvedValue(value);
  },

  /**
   * Mock a failed async operation
   */
  mockFailure(error: Error): jest.Mock<Promise<never>> {
    return jest.fn().mockRejectedValue(error);
  },

  /**
   * Money test utilities
   */
  money: {
    /**
     * Create test money values
     */
    create: (value: string): Money => createMoney(value),

    /**
     * Assert money values are equal
     */
    assertEqual: (actual: Money, expected: Money): void => {
      expect(actual.amount.toFixed(4)).toBe(expected.amount.toFixed(4));
    },

    /**
     * Assert money value equals string
     */
    assertEqualString: (actual: Money, expected: string): void => {
      expect(actual.amount.toFixed(4)).toBe(parseFloat(expected).toFixed(4));
    },
  },
};

/**
 * Custom Jest matchers for the billing system
 */
// Jest matchers will be available at runtime

expect.extend({
  toBeValidDate(received: unknown) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid Date`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid Date`,
        pass: false,
      };
    }
  },

  toBeMoneyEqual(received: Money, expected: Money) {
    const pass = received.amount.equals(expected.amount);
    if (pass) {
      return {
        message: () =>
          `Expected ${received.amount.toString()} not to equal ${expected.amount.toString()}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${received.amount.toString()} to equal ${expected.amount.toString()}`,
        pass: false,
      };
    }
  },

  toBeMoneyGreaterThan(received: Money, expected: Money) {
    const pass = received.amount.greaterThan(expected.amount);
    if (pass) {
      return {
        message: () =>
          `Expected ${received.amount.toString()} not to be greater than ${expected.amount.toString()}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${received.amount.toString()} to be greater than ${expected.amount.toString()}`,
        pass: false,
      };
    }
  },

  toBeMoneyLessThan(received: Money, expected: Money) {
    const pass = received.amount.lessThan(expected.amount);
    if (pass) {
      return {
        message: () =>
          `Expected ${received.amount.toString()} not to be less than ${expected.amount.toString()}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${received.amount.toString()} to be less than ${expected.amount.toString()}`,
        pass: false,
      };
    }
  },

  toHaveMoneyValue(received: Money, expected: string) {
    const expectedAmount = parseFloat(expected);
    const receivedAmount = parseFloat(received.amount.toString());
    const pass = Math.abs(receivedAmount - expectedAmount) < 0.0001; // Allow for floating point precision

    if (pass) {
      return {
        message: () =>
          `Expected ${received.amount.toString()} not to have value ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${received.amount.toString()} to have value ${expected}`,
        pass: false,
      };
    }
  },
});

/**
 * Test data factories
 */
export const testDataFactory = {
  /**
   * Create test organization
   */
  organization: (overrides: Partial<any> = {}) => ({
    id: "org_1",
    name: "Test Organization",
    domain: "test.com",
    billingEmail: "billing@test.com",
    status: "ACTIVE",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  }),

  /**
   * Create test entity
   */
  entity: (overrides: Partial<any> = {}) => ({
    id: "entity_1",
    organizationId: "org_1",
    name: "Test Entity",
    description: "A test entity",
    billingSettings: {},
    status: "ACTIVE",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  }),

  /**
   * Create test user
   */
  user: (overrides: Partial<any> = {}) => ({
    id: "user_1",
    name: "Test User",
    email: "user@test.com",
    globalRole: "USER",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  }),

  /**
   * Create test credit package
   */
  creditPackage: (overrides: Partial<any> = {}) => ({
    id: "package_1",
    name: "Basic Package",
    creditsAmount: 100.0,
    price: 50.0,
    validityDays: 365,
    description: "Basic credit package",
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  }),
};

/**
 * Test assertion helpers
 */
export const testAssertions = {
  /**
   * Assert that a promise resolves within a timeout
   */
  async resolveWithinTimeout<T>(
    promise: Promise<T>,
    timeout: number = 5000,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Promise did not resolve within ${timeout}ms`)),
        timeout,
      );
    });

    return Promise.race([promise, timeoutPromise]);
  },

  /**
   * Assert that a promise rejects with a specific error
   */
  async rejectsWith(
    promise: Promise<any>,
    errorMessage: string,
  ): Promise<void> {
    try {
      await promise;
      throw new Error("Expected promise to reject");
    } catch (error) {
      expect(error instanceof Error ? error.message : String(error)).toContain(
        errorMessage,
      );
    }
  },

  /**
   * Assert that an array contains items matching a predicate
   */
  arrayContains<T>(
    array: T[],
    predicate: (item: T) => boolean,
    message?: string,
  ): void {
    const found = array.some(predicate);
    if (!found) {
      throw new Error(message || "Array does not contain expected item");
    }
  },

  /**
   * Assert that all items in an array match a predicate
   */
  arrayAllMatch<T>(
    array: T[],
    predicate: (item: T) => boolean,
    message?: string,
  ): void {
    const allMatch = array.every(predicate);
    if (!allMatch) {
      throw new Error(message || "Not all items in array match predicate");
    }
  },
};
