// import { PrismaClient } from "@prisma/client";
import { SeatBasedPricer } from "../src/services/pricing/SeatBasedPricer";
import { createMoney, moneyToDecimalString } from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  entitySubscription: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  entityUser: {
    count: jest.fn(),
  },
} as Record<string, any>;

describe("SeatBasedPricer", () => {
  let pricer: SeatBasedPricer;

  beforeEach(() => {
    jest.clearAllMocks();
    pricer = new SeatBasedPricer(mockPrisma as any);
  });

  describe("Subscription Creation", () => {
    test("should create monthly subscription", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 10;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 500.0,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.entityId).toBe(entityId);
      expect(result.subscriptionType).toBe(subscriptionType);
      expect(result.seatCount).toBe(seatCount);
      expect(moneyToDecimalString(result.pricePerSeat)).toBe("50.0000");
      expect(moneyToDecimalString(result.totalPrice)).toBe("500.0000");
      expect(result.status).toBe("ACTIVE");

      expect(mockPrisma.entitySubscription.create).toHaveBeenCalledWith({
        data: {
          entityId,
          subscriptionType,
          seatCount,
          monthlyPrice: 500.0,
          annualPrice: 0,
          billingCycle: "MONTHLY",
          status: "ACTIVE",
          nextBillingDate: expect.any(Date),
        },
      });
    });

    test("should create annual subscription", async () => {
      const entityId = "entity_1";
      const subscriptionType = "ANNUAL";
      const seatCount = 5;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 0,
        annualPrice: 250.0,
        billingCycle: "ANNUAL",
        status: "ACTIVE",
        nextBillingDate: new Date("2026-01-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.entityId).toBe(entityId);
      expect(result.subscriptionType).toBe(subscriptionType);
      expect(result.seatCount).toBe(seatCount);
      expect(moneyToDecimalString(result.totalPrice)).toBe("250.0000");
      expect(result.status).toBe("ACTIVE");

      expect(mockPrisma.entitySubscription.create).toHaveBeenCalledWith({
        data: {
          entityId,
          subscriptionType,
          seatCount,
          monthlyPrice: 0,
          annualPrice: 250.0,
          billingCycle: "ANNUAL",
          status: "ACTIVE",
          nextBillingDate: expect.any(Date),
        },
      });
    });

    test("should calculate next billing date for monthly subscription", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 10;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 500.0,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      // Should set next billing date to next month
      expect(result.nextBillingDate).toBeInstanceOf(Date);
      expect(result.nextBillingDate.getMonth()).toBeGreaterThan(
        new Date().getMonth() - 1,
      );
    });

    test("should calculate next billing date for annual subscription", async () => {
      const entityId = "entity_1";
      const subscriptionType = "ANNUAL";
      const seatCount = 5;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 0,
        annualPrice: 250.0,
        billingCycle: "ANNUAL",
        status: "ACTIVE",
        nextBillingDate: new Date("2026-01-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      // Should set next billing date to next year
      expect(result.nextBillingDate).toBeInstanceOf(Date);
      expect(result.nextBillingDate.getFullYear()).toBeGreaterThan(
        new Date().getFullYear(),
      );
    });
  });

  describe("Seat Count Updates", () => {
    test("should update seat count for monthly subscription", async () => {
      const entityId = "entity_1";
      const newSeatCount = 15;
      const effectiveDate = new Date("2025-01-15");

      const mockExistingSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 10,
        billingCycle: "MONTHLY",
        monthlyPrice: 500.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockExistingSubscription,
      );
      mockPrisma.entitySubscription.update.mockResolvedValue({
        ...mockExistingSubscription,
        seatCount: newSeatCount,
        monthlyPrice: 750.0,
      });

      const result = await pricer.updateSeatCount(
        entityId,
        newSeatCount,
        effectiveDate,
      );

      expect(result.previousSeatCount).toBe(10);
      expect(result.newSeatCount).toBe(newSeatCount);
      expect(result.effectiveDate).toEqual(effectiveDate);
      expect(result.nextBillingDate).toEqual(
        mockExistingSubscription.nextBillingDate,
      );

      expect(mockPrisma.entitySubscription.update).toHaveBeenCalledWith({
        where: { id: mockExistingSubscription.id },
        data: {
          seatCount: newSeatCount,
          monthlyPrice: 750.0, // $50 * 15 seats
          annualPrice: 0,
        },
      });
    });

    test("should update seat count for annual subscription", async () => {
      const entityId = "entity_1";
      const newSeatCount = 8;
      const effectiveDate = new Date("2025-01-15");

      const mockExistingSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 10,
        billingCycle: "ANNUAL",
        monthlyPrice: 0,
        annualPrice: 6000.0,
        status: "ACTIVE",
        nextBillingDate: new Date("2026-01-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockExistingSubscription,
      );
      mockPrisma.entitySubscription.update.mockResolvedValue({
        ...mockExistingSubscription,
        seatCount: newSeatCount,
        annualPrice: 4800.0,
      });

      const result = await pricer.updateSeatCount(
        entityId,
        newSeatCount,
        effectiveDate,
      );

      expect(result.previousSeatCount).toBe(10);
      expect(result.newSeatCount).toBe(newSeatCount);

      expect(mockPrisma.entitySubscription.update).toHaveBeenCalledWith({
        where: { id: mockExistingSubscription.id },
        data: {
          seatCount: newSeatCount,
          monthlyPrice: 0,
          annualPrice: 4800.0, // $50 * 8 seats * 12 months
        },
      });
    });

    test("should throw error when no active subscription found", async () => {
      const entityId = "entity_1";
      const newSeatCount = 15;

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(null);

      await expect(
        pricer.updateSeatCount(entityId, newSeatCount),
      ).rejects.toThrow("No active subscription found for entity entity_1");
    });
  });

  describe("Subscription Retrieval", () => {
    test("should get entity subscription", async () => {
      const entityId = "entity_1";

      const mockSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 10,
        billingCycle: "MONTHLY",
        monthlyPrice: 500.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockSubscription,
      );

      const result = await pricer.getEntitySubscription(entityId);

      expect(result).not.toBeNull();
      expect(result!.entityId).toBe(entityId);
      expect(result!.subscriptionType).toBe("MONTHLY");
      expect(result!.seatCount).toBe(10);
      expect(moneyToDecimalString(result!.pricePerSeat)).toBe("50.0000");
      expect(moneyToDecimalString(result!.totalPrice)).toBe("500.0000");
      expect(result!.status).toBe("ACTIVE");
    });

    test("should return null when no subscription found", async () => {
      const entityId = "entity_1";

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(null);

      const result = await pricer.getEntitySubscription(entityId);

      expect(result).toBeNull();
    });
  });

  describe("Seat Recommendations", () => {
    test("should get recommended seat count based on active users", async () => {
      const entityId = "entity_1";
      const activeUserCount = 12;

      mockPrisma.entityUser.count.mockResolvedValue(activeUserCount);

      const result = await pricer.getRecommendedSeatCount(entityId);

      expect(result).toBe(activeUserCount);
      expect(mockPrisma.entityUser.count).toHaveBeenCalledWith({
        where: {
          entityId,
          status: "ACTIVE",
        },
      });
    });

    test("should return 0 when no active users", async () => {
      const entityId = "entity_1";

      mockPrisma.entityUser.count.mockResolvedValue(0);

      const result = await pricer.getRecommendedSeatCount(entityId);

      expect(result).toBe(0);
    });
  });

  describe("Seat Utilization", () => {
    test("should calculate seat utilization for under-utilized subscription", async () => {
      const entityId = "entity_1";

      const mockSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 20,
        billingCycle: "MONTHLY",
        monthlyPrice: 1000.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.entityUser.count.mockResolvedValue(12);

      const result = await pricer.calculateSeatUtilization(entityId);

      expect(result.allocatedSeats).toBe(20);
      expect(result.activeUsers).toBe(12);
      expect(result.utilizationPercentage).toBe(60); // 12/20 * 100
      expect(result.overAllocated).toBe(false);
    });

    test("should calculate seat utilization for over-allocated subscription", async () => {
      const entityId = "entity_1";

      const mockSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 10,
        billingCycle: "MONTHLY",
        monthlyPrice: 500.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.entityUser.count.mockResolvedValue(15);

      const result = await pricer.calculateSeatUtilization(entityId);

      expect(result.allocatedSeats).toBe(10);
      expect(result.activeUsers).toBe(15);
      expect(result.utilizationPercentage).toBe(150); // 15/10 * 100
      expect(result.overAllocated).toBe(true);
    });

    test("should handle entity with no subscription", async () => {
      const entityId = "entity_1";

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(null);
      mockPrisma.entityUser.count.mockResolvedValue(8);

      const result = await pricer.calculateSeatUtilization(entityId);

      expect(result.allocatedSeats).toBe(0);
      expect(result.activeUsers).toBe(8);
      expect(result.utilizationPercentage).toBe(0);
      expect(result.overAllocated).toBe(true);
    });

    test("should handle perfect utilization", async () => {
      const entityId = "entity_1";

      const mockSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 10,
        billingCycle: "MONTHLY",
        monthlyPrice: 500.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.entityUser.count.mockResolvedValue(10);

      const result = await pricer.calculateSeatUtilization(entityId);

      expect(result.allocatedSeats).toBe(10);
      expect(result.activeUsers).toBe(10);
      expect(result.utilizationPercentage).toBe(100);
      expect(result.overAllocated).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero seat count", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 0;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 0,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.seatCount).toBe(0);
      expect(moneyToDecimalString(result.totalPrice)).toBe("0.0000");
    });

    test("should handle large seat count", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 1000;
      const pricePerSeat = createMoney("50.00");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 50000.0,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.seatCount).toBe(1000);
      expect(moneyToDecimalString(result.totalPrice)).toBe("50000.0000");
    });

    test("should handle seat count reduction", async () => {
      const entityId = "entity_1";
      const newSeatCount = 5;

      const mockExistingSubscription = {
        id: "subscription_1",
        entityId,
        seatCount: 20,
        billingCycle: "MONTHLY",
        monthlyPrice: 1000.0,
        annualPrice: 0,
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.findFirst.mockResolvedValue(
        mockExistingSubscription,
      );
      mockPrisma.entitySubscription.update.mockResolvedValue({
        ...mockExistingSubscription,
        seatCount: newSeatCount,
        monthlyPrice: 250.0,
      });

      const result = await pricer.updateSeatCount(entityId, newSeatCount);

      expect(result.previousSeatCount).toBe(20);
      expect(result.newSeatCount).toBe(5);
    });

    test("should handle fractional price per seat", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 7;
      const pricePerSeat = createMoney("49.99");

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 349.93,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-01"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.seatCount).toBe(7);
      expect(moneyToDecimalString(result.pricePerSeat)).toBe("49.9900");
      expect(moneyToDecimalString(result.totalPrice)).toBe("349.9300");
    });
  });

  describe("Billing Cycle Management", () => {
    test("should handle monthly billing cycle dates correctly", async () => {
      const entityId = "entity_1";
      const subscriptionType = "MONTHLY";
      const seatCount = 10;
      const pricePerSeat = createMoney("50.00");

      // Mock current date
      const currentDate = new Date("2025-01-15");
      jest.useFakeTimers().setSystemTime(currentDate);

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 500.0,
        annualPrice: 0,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        nextBillingDate: new Date("2025-02-15"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.nextBillingDate.getMonth()).toBe(1); // February (0-indexed)
      expect(result.nextBillingDate.getFullYear()).toBe(2025);

      jest.useRealTimers();
    });

    test("should handle annual billing cycle dates correctly", async () => {
      const entityId = "entity_1";
      const subscriptionType = "ANNUAL";
      const seatCount = 5;
      const pricePerSeat = createMoney("50.00");

      // Mock current date
      const currentDate = new Date("2025-01-15");
      jest.useFakeTimers().setSystemTime(currentDate);

      const mockCreatedSubscription = {
        id: "subscription_1",
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice: 0,
        annualPrice: 250.0,
        billingCycle: "ANNUAL",
        status: "ACTIVE",
        nextBillingDate: new Date("2026-01-15"),
      };

      mockPrisma.entitySubscription.create.mockResolvedValue(
        mockCreatedSubscription,
      );

      const result = await pricer.createSubscription(
        entityId,
        subscriptionType,
        seatCount,
        pricePerSeat,
      );

      expect(result.nextBillingDate.getFullYear()).toBe(2026);

      jest.useRealTimers();
    });
  });
});
