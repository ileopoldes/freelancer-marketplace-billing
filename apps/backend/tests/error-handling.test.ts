import { PrismaClient } from "@prisma/client";
import { MarketplaceEventProcessor } from "../src/services/billing/MarketplaceEventProcessor";
import { CreditPackageManager } from "../src/services/billing/CreditPackageManager";
import { PayAsYouGoPricer } from "../src/services/pricing/PayAsYouGoPricer";
import { SeatBasedPricer } from "../src/services/pricing/SeatBasedPricer";
import { createMoney } from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  marketplaceEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  entityCreditBalance: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  creditPackage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  entityUser: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  entity: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  credit: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  entitySubscription: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $on: jest.fn(),
  $use: jest.fn(),
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $extends: jest.fn(),
} as Record<string, any>;

describe("Error Handling and Database Resilience", () => {
  let eventProcessor: MarketplaceEventProcessor;
  let creditPackageManager: CreditPackageManager;
  let payAsYouGoPricer: PayAsYouGoPricer;
  let seatBasedPricer: SeatBasedPricer;

  beforeEach(() => {
    jest.clearAllMocks();
    eventProcessor = new MarketplaceEventProcessor(mockPrisma as any);
    creditPackageManager = new CreditPackageManager(mockPrisma as any);
    payAsYouGoPricer = new PayAsYouGoPricer(mockPrisma as any);
    seatBasedPricer = new SeatBasedPricer(mockPrisma as any);
  });

  describe("Database Connection Failures", () => {
    test("should handle database connection timeout in event processing", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      // Mock database connection timeout
      mockPrisma.entity.findUnique.mockRejectedValue(
        new Error("Connection timeout"),
      );

      await expect(eventProcessor.processEvent(eventRequest)).rejects.toThrow(
        "Connection timeout",
      );
    });

    test("should handle database connection failure during credit deduction", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");

      // Mock database connection failure
      mockPrisma.entityCreditBalance.findFirst.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        creditPackageManager.deductCreditsForEvent(
          entityId,
          userId,
          eventType,
          creditAmount,
          "test reason",
        ),
      ).rejects.toThrow("Database connection failed");
    });

    test("should handle database connection failure during subscription creation", async () => {
      const entityId = "entity_1";
      const seatCount = 5;
      const billingCycle = "monthly" as const;

      // Mock database connection failure
      mockPrisma.entitySubscription.create.mockRejectedValue(
        new Error("Database connection lost"),
      );

      await expect(
        seatBasedPricer.createSubscription(
          entityId,
          "MONTHLY",
          seatCount,
          createMoney("100"),
        ),
      ).rejects.toThrow("Database connection lost");
    });

    test("should handle database connection failure during credit package purchase", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      // Mock successful package lookup but failed balance update
      mockPrisma.creditPackage.findUnique.mockResolvedValue({
        id: packageId,
        active: true,
        creditsAmount: 100,
        price: 50,
      });

      mockPrisma.entityCreditBalance.findFirst.mockRejectedValue(
        new Error("Database connection unstable"),
      );

      await expect(
        creditPackageManager.purchaseCreditPackage(
          entityId,
          packageId,
          purchasedBy,
        ),
      ).rejects.toThrow("Database connection unstable");
    });

    test("should handle network interruption during bulk event processing", async () => {
      const events = [
        {
          entityId: "entity_1",
          userId: "user_1",
          eventType: "project_posted" as const,
          quantity: 1,
          metadata: { title: "Project 1" },
        },
        {
          entityId: "entity_1",
          userId: "user_1",
          eventType: "project_posted" as const,
          quantity: 1,
          metadata: { title: "Project 2" },
        },
      ];

      // Mock successful processing for first event
      mockPrisma.entity.findUnique
        .mockResolvedValueOnce({
          id: "entity_1",
          name: "Test Entity",
        })
        .mockResolvedValueOnce({
          id: "entity_1",
          name: "Test Entity",
        });
      mockPrisma.entityUser.findFirst.mockResolvedValue({
        id: "entityuser_1",
        entityId: "entity_1",
        userId: "user_1",
        status: "ACTIVE",
      });
      mockPrisma.marketplaceEvent.create
        .mockResolvedValueOnce({
          id: "event_1",
          entityId: "entity_1",
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
        })
        .mockRejectedValueOnce(new Error("Network error"));

      // Mock credit balance check to force invoice billing
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);

      const results = await eventProcessor.processBatchEvents(events);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].reason).toBe("Network error");
    });
  });

  describe("Concurrent Operations", () => {
    test("should handle concurrent credit deductions with proper locking", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");

      // Mock initial balance
      const initialBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100,
        usedCredits: 0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(
        initialBalance,
      );
      mockPrisma.entityUser.findFirst.mockResolvedValue({
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 1000,
      });

      // Mock concurrent update conflict
      mockPrisma.entityCreditBalance.update.mockRejectedValueOnce(
        new Error("Concurrent update conflict"),
      );

      await expect(
        creditPackageManager.deductCreditsForEvent(
          entityId,
          userId,
          eventType,
          creditAmount,
          "test reason",
        ),
      ).rejects.toThrow("Concurrent update conflict");
    });

    test("should handle concurrent subscription updates", async () => {
      const entityId = "entity_1";
      const newSeatCount = 10;

      // Mock existing subscription
      mockPrisma.entitySubscription.findFirst.mockResolvedValue({
        id: "sub_1",
        entityId,
        seatCount: 5,
        billingCycle: "monthly",
        status: "ACTIVE",
      });

      // Mock concurrent update conflict
      mockPrisma.entitySubscription.update.mockRejectedValue(
        new Error("Record was modified by another transaction"),
      );

      await expect(
        seatBasedPricer.updateSeatCount(entityId, newSeatCount),
      ).rejects.toThrow("Record was modified by another transaction");
    });

    test("should handle concurrent credit package purchases", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      // Mock package lookup
      mockPrisma.creditPackage.findUnique.mockResolvedValue({
        id: packageId,
        active: true,
        creditsAmount: 100,
        price: 50,
      });

      // Mock existing balance
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue({
        id: "balance_1",
        entityId,
        totalCredits: 50,
        usedCredits: 0,
      });

      // Mock concurrent update conflict
      mockPrisma.entityCreditBalance.update.mockRejectedValue(
        new Error("Concurrent modification detected"),
      );

      await expect(
        creditPackageManager.purchaseCreditPackage(
          entityId,
          packageId,
          purchasedBy,
        ),
      ).rejects.toThrow("Concurrent modification detected");
    });
  });

  describe("Transaction Handling", () => {
    test("should handle transaction rollback during event processing", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      // Mock successful validation
      mockPrisma.entity.findUnique.mockResolvedValue({
        id: "entity_1",
        name: "Test Entity",
      });
      mockPrisma.entityUser.findFirst.mockResolvedValue({
        id: "entityuser_1",
        entityId: "entity_1",
        userId: "user_1",
        status: "ACTIVE",
      });

      // Mock transaction rollback
      mockPrisma.marketplaceEvent.create.mockRejectedValue(
        new Error("Transaction was rolled back"),
      );

      await expect(eventProcessor.processEvent(eventRequest)).rejects.toThrow(
        "Transaction was rolled back",
      );
    });

    test("should handle partial transaction failure during credit application", async () => {
      const customerId = "customer_1";
      const invoiceAmount = createMoney("100.00");

      // Mock available credits
      mockPrisma.credit.findMany.mockResolvedValue([
        {
          id: "credit_1",
          customerId,
          amount: 50,
          type: "MANUAL",
          createdAt: new Date(),
          appliedAt: null,
        },
      ]);

      // Mock successful credit lookup but failed application
      mockPrisma.credit.update.mockRejectedValue(
        new Error("Transaction integrity constraint violation"),
      );

      await expect(
        creditPackageManager.applyCreditsToInvoice(
          customerId,
          invoiceAmount,
          "invoice_1",
        ),
      ).rejects.toThrow("Transaction integrity constraint violation");
    });
  });

  describe("Data Consistency", () => {
    test("should handle inconsistent credit balance data", async () => {
      const entityId = "entity_1";

      // Mock inconsistent balance (negative available credits)
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue({
        id: "balance_1",
        entityId,
        totalCredits: 100,
        usedCredits: 150, // Used more than total - inconsistent state
      });

      const result =
        await creditPackageManager.getEntityCreditBalance(entityId);

      expect(result).toBeTruthy();
      expect(result!.availableCredits.amount.toNumber()).toBe(-50);
    });

    test("should handle orphaned subscription records", async () => {
      const entityId = "nonexistent_entity";

      // Mock orphaned subscription (references non-existent entity)
      mockPrisma.entitySubscription.findFirst.mockResolvedValue({
        id: "sub_1",
        entityId,
        seatCount: 5,
        billingCycle: "monthly",
        status: "ACTIVE",
      });

      const result = await seatBasedPricer.getEntitySubscription(entityId);

      expect(result).toBeTruthy();
      expect(result!.entityId).toBe(entityId);
    });

    test("should handle duplicate event records", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      // Mock duplicate events (same event processed twice)
      mockPrisma.marketplaceEvent.findMany.mockResolvedValue([
        {
          id: "event_1",
          entityId,
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
          metadata: { title: "Duplicate Event" },
          user: { id: "user_1", name: "Test User", email: "test@example.com" },
        },
        {
          id: "event_2", // Different ID but same event details
          entityId,
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
          metadata: { title: "Duplicate Event" },
          user: { id: "user_1", name: "Test User", email: "test@example.com" },
        },
      ]);

      const results = await eventProcessor.getEventHistory(
        entityId,
        fromDate,
        toDate,
      );

      expect(results).toHaveLength(2);
      // Should handle duplicates gracefully without throwing
    });
  });

  describe("Resource Limits", () => {
    test("should handle memory pressure during bulk operations", async () => {
      const largeEventBatch = Array.from({ length: 10000 }, (_, i) => ({
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: `Project ${i}` },
      }));

      // Mock memory exhaustion during entity validation
      mockPrisma.entity.findUnique.mockRejectedValue(
        new Error("JavaScript heap out of memory"),
      );

      const results = await eventProcessor.processBatchEvents(largeEventBatch);

      expect(results).toHaveLength(10000);
      results.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.reason).toBe("Validation failed: JavaScript heap out of memory");
      });
    });

    test("should handle query timeout for large date ranges", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2020-01-01");
      const toDate = new Date("2025-12-31");

      // Mock query timeout
      mockPrisma.marketplaceEvent.findMany.mockRejectedValue(
        new Error("Query timeout exceeded"),
      );

      await expect(
        eventProcessor.getEventHistory(entityId, fromDate, toDate),
      ).rejects.toThrow("Query timeout exceeded");
    });
  });

  describe("Input Validation Errors", () => {
    test("should handle malformed entity IDs", async () => {
      const malformedEntityId = "invalid-entity-id-with-special-chars@#$%";

      // Mock database constraint violation
      mockPrisma.entityCreditBalance.findFirst.mockRejectedValue(
        new Error("Invalid input syntax for type uuid"),
      );

      await expect(
        creditPackageManager.getEntityCreditBalance(malformedEntityId),
      ).rejects.toThrow("Invalid input syntax for type uuid");
    });

    test("should handle SQL injection attempts", async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      // Prisma should handle this, but test the error propagation
      mockPrisma.entityCreditBalance.findFirst.mockRejectedValue(
        new Error("Syntax error in SQL statement"),
      );

      await expect(
        creditPackageManager.getEntityCreditBalance(maliciousInput),
      ).rejects.toThrow("Syntax error in SQL statement");
    });

    test("should handle extremely large numeric values", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const extremeAmount = createMoney("999999999999999999999999.99");

      // Mock numeric overflow
      mockPrisma.entityCreditBalance.findFirst.mockRejectedValue(
        new Error("Numeric value out of range"),
      );

      await expect(
        creditPackageManager.deductCreditsForEvent(
          entityId,
          userId,
          eventType,
          extremeAmount,
          "test reason",
        ),
      ).rejects.toThrow("Numeric value out of range");
    });
  });

  describe("Service Degradation", () => {
    test("should handle partial service availability", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      // Mock entity service available but user service down
      mockPrisma.entity.findUnique.mockResolvedValue({
        id: "entity_1",
        name: "Test Entity",
      });
      mockPrisma.entityUser.findFirst.mockRejectedValue(
        new Error("Service temporarily unavailable"),
      );

      await expect(eventProcessor.processEvent(eventRequest)).rejects.toThrow(
        "Service temporarily unavailable",
      );
    });

    test("should handle read replica delays", async () => {
      const entityId = "entity_1";

      // Mock read replica delay (entity not found in replica but exists in master)
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);

      const result =
        await creditPackageManager.getEntityCreditBalance(entityId);

      expect(result).toBeNull();
    });
  });

  describe("Error Recovery", () => {
    test("should handle graceful degradation when optional services fail", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      // Mock successful basic processing but failed optional features
      mockPrisma.entity.findUnique.mockResolvedValue({
        id: "entity_1",
        name: "Test Entity",
      });
      mockPrisma.entityUser.findFirst.mockResolvedValue({
        id: "entityuser_1",
        entityId: "entity_1",
        userId: "user_1",
        status: "ACTIVE",
      });
      mockPrisma.marketplaceEvent.create.mockResolvedValue({
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
      });

      // Mock credit service failure - should fall back to invoicing
      jest
        .spyOn(eventProcessor["creditPackageManager"], "getEntityCreditBalance")
        .mockResolvedValue(null);

      const result = await eventProcessor.processEvent(eventRequest);

      expect(result.success).toBe(true);
      expect(result.billingMethod).toBe("INVOICE");
      expect(result.reason).toBe("Insufficient credits");
    });
  });
});
