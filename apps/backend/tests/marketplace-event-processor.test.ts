// import { PrismaClient } from "@prisma/client";
import { MarketplaceEventProcessor } from "../src/services/billing/MarketplaceEventProcessor";
import { createMoney, moneyToDecimalString } from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  marketplaceEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  entityCreditBalance: {
    findFirst: jest.fn(),
  },
  entityUser: {
    findFirst: jest.fn(),
  },
  entity: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
} as Record<string, any>;

describe("MarketplaceEventProcessor", () => {
  let eventProcessor: MarketplaceEventProcessor;

  const setupCommonMocks = () => {
    // Mock entity and user lookups
    mockPrisma.entity.findUnique.mockResolvedValue({
      id: "entity_1",
      name: "Test Entity",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      name: "Test User",
    });
    mockPrisma.entityUser.findFirst.mockResolvedValue({
      id: "entityuser_1",
      entityId: "entity_1",
      userId: "user_1",
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventProcessor = new MarketplaceEventProcessor(mockPrisma as any);
    setupCommonMocks();
  });

  describe("Event Processing", () => {
    test("should process event with credit deduction", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      const mockCreditBalance = {
        entityId: "entity_1",
        totalCredits: createMoney("100.00"),
        usedCredits: createMoney("30.00"),
        availableCredits: createMoney("70.00"),
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Test Project" },
      };

      // Mock entity and user lookups
      mockPrisma.entity.findUnique.mockResolvedValue({
        id: "entity_1",
        name: "Test Entity",
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user_1",
        name: "Test User",
      });
      mockPrisma.entityUser.findFirst.mockResolvedValue({
        id: "entityuser_1",
        entityId: "entity_1",
        userId: "user_1",
      });

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      // Mock credit balance check
      jest
        .spyOn(eventProcessor["creditPackageManager"], "getEntityCreditBalance")
        .mockResolvedValue(mockCreditBalance);

      // Mock credit deduction
      jest
        .spyOn(eventProcessor["creditPackageManager"], "deductCreditsForEvent")
        .mockResolvedValue({
          success: true,
          deductedAmount: createMoney("10.00"),
          remainingBalance: createMoney("60.00"),
        });

      const result = await eventProcessor.processEvent(eventRequest);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.billingMethod).toBe("CREDITS");
      expect(result.creditDeduction).toBeDefined();
      expect(moneyToDecimalString(result.creditDeduction!.deductedAmount)).toBe(
        "10.0000",
      );
      expect(
        moneyToDecimalString(result.creditDeduction!.remainingBalance),
      ).toBe("60.0000");
    });

    test("should process event with invoice fallback when insufficient credits", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      const mockCreditBalance = {
        entityId: "entity_1",
        totalCredits: createMoney("100.00"),
        usedCredits: createMoney("95.00"),
        availableCredits: createMoney("5.00"), // Insufficient for $10 event
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Test Project" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      // Mock credit balance check
      jest
        .spyOn(eventProcessor["creditPackageManager"], "getEntityCreditBalance")
        .mockResolvedValue(mockCreditBalance);

      const result = await eventProcessor.processEvent(eventRequest);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.billingMethod).toBe("INVOICE");
      expect(result.reason).toBe("Insufficient credits");
      expect(result.creditDeduction).toBeUndefined();
    });

    test("should process event with invoice fallback when credit deduction fails", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      const mockCreditBalance = {
        entityId: "entity_1",
        totalCredits: createMoney("100.00"),
        usedCredits: createMoney("30.00"),
        availableCredits: createMoney("70.00"),
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Test Project" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      // Mock credit balance check
      jest
        .spyOn(eventProcessor["creditPackageManager"], "getEntityCreditBalance")
        .mockResolvedValue(mockCreditBalance);

      // Mock credit deduction failure
      jest
        .spyOn(eventProcessor["creditPackageManager"], "deductCreditsForEvent")
        .mockResolvedValue({
          success: false,
          deductedAmount: createMoney("0.00"),
          remainingBalance: createMoney("70.00"),
          reason: "Credit limit exceeded for user",
        });

      const result = await eventProcessor.processEvent(eventRequest);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.billingMethod).toBe("INVOICE");
      expect(result.reason).toContain("Credit deduction failed");
      expect(result.creditDeduction).toBeUndefined();
    });

    test("should force invoice generation when requested", async () => {
      const eventRequest = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Test Project" },
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Test Project" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventProcessor.processEvent(eventRequest, {
        forceInvoicing: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.billingMethod).toBe("INVOICE");
      expect(result.reason).toBe("Forced invoicing");
      expect(result.creditDeduction).toBeUndefined();
    });

    test("should handle different event types with correct pricing", async () => {
      const freelancerHiredEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "freelancer_hired" as const,
        quantity: 1,
        metadata: { freelancerId: "freelancer_1" },
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "freelancer_hired",
        quantity: 1,
        unitPrice: 10.0, // Same price as project_posted for consistency
        metadata: { freelancerId: "freelancer_1" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventProcessor.processEvent(freelancerHiredEvent, {
        forceInvoicing: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.billingMethod).toBe("INVOICE");
      expect(moneyToDecimalString(result.calculation.finalAmount)).toBe(
        "10.0000",
      );
    });
  });

  describe("Batch Processing", () => {
    test("should process multiple events in batch", async () => {
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
          eventType: "freelancer_hired" as const,
          quantity: 1,
          metadata: { freelancerId: "freelancer_1" },
        },
      ];

      const mockCreatedEvents = [
        {
          id: "event_1",
          entityId: "entity_1",
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
          metadata: { title: "Project 1" },
        },
        {
          id: "event_2",
          entityId: "entity_1",
          userId: "user_1",
          eventType: "freelancer_hired",
          quantity: 1,
          unitPrice: 25.0,
          metadata: { freelancerId: "freelancer_1" },
        },
      ];

      mockPrisma.marketplaceEvent.create
        .mockResolvedValueOnce(mockCreatedEvents[0])
        .mockResolvedValueOnce(mockCreatedEvents[1]);

      const results = await eventProcessor.processBatchEvents(events, {
        forceInvoicing: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].eventId).toBe("event_1");
      expect(results[1].success).toBe(true);
      expect(results[1].eventId).toBe("event_2");
    });

    test("should handle batch processing with mixed success/failure", async () => {
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

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Project 1" },
      };

      mockPrisma.marketplaceEvent.create
        .mockResolvedValueOnce(mockCreatedEvent)
        .mockRejectedValueOnce(new Error("Database error"));

      const results = await eventProcessor.processBatchEvents(events, {
        forceInvoicing: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].eventId).toBe("event_1");
      expect(results[1].success).toBe(false);
      expect(results[1].eventId).toBe("");
      expect(results[1].reason).toBe("Database error");
    });
  });

  describe("Event History", () => {
    test("should retrieve event history for an entity", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      const mockEvents = [
        {
          id: "event_1",
          entityId,
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
          metadata: { title: "Project 1" },
          user: {
            id: "user_1",
            name: "Test User",
            email: "test@example.com",
          },
        },
        {
          id: "event_2",
          entityId,
          userId: "user_2",
          eventType: "freelancer_hired",
          quantity: 1,
          unitPrice: 25.0,
          timestamp: new Date("2025-01-20"),
          metadata: { freelancerId: "freelancer_1" },
          user: {
            id: "user_2",
            name: "Test User 2",
            email: "test2@example.com",
          },
        },
      ];

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue(mockEvents);

      const results = await eventProcessor.getEventHistory(
        entityId,
        fromDate,
        toDate,
      );

      expect(results).toHaveLength(2);
      expect(results[0].eventType).toBe("project_posted");
      expect(results[0].user.name).toBe("Test User");
      expect(results[1].eventType).toBe("freelancer_hired");
      expect(results[1].user.name).toBe("Test User 2");

      expect(mockPrisma.marketplaceEvent.findMany).toHaveBeenCalledWith({
        where: {
          entityId,
          timestamp: {
            gte: fromDate,
            lte: toDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    });

    test("should filter event history by event type", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");
      const eventType = "project_posted";

      const mockEvents = [
        {
          id: "event_1",
          entityId,
          userId: "user_1",
          eventType: "project_posted",
          quantity: 1,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
          metadata: { title: "Project 1" },
          user: {
            id: "user_1",
            name: "Test User",
            email: "test@example.com",
          },
        },
      ];

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue(mockEvents);

      const results = await eventProcessor.getEventHistory(
        entityId,
        fromDate,
        toDate,
        eventType,
      );

      expect(results).toHaveLength(1);
      expect(results[0].eventType).toBe("project_posted");

      expect(mockPrisma.marketplaceEvent.findMany).toHaveBeenCalledWith({
        where: {
          entityId,
          timestamp: {
            gte: fromDate,
            lte: toDate,
          },
          eventType,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    });
  });

  describe("Event Validation", () => {
    test("should validate event request", async () => {
      const validEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: { title: "Valid Project" },
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: { title: "Valid Project" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventProcessor.processEvent(validEvent, {
        forceInvoicing: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
    });

    test("should handle invalid event types", async () => {
      const invalidEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "invalid_type" as any,
        quantity: 1,
        metadata: {},
      };

      // Mock validation failure
      jest
        .spyOn(eventProcessor as any, "validateEventRequest")
        .mockRejectedValue(new Error("Invalid event type"));

      await expect(eventProcessor.processEvent(invalidEvent)).rejects.toThrow(
        "Invalid event type",
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero quantity events", async () => {
      const zeroQuantityEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 0,
        metadata: { title: "Zero Quantity Project" },
      };

      // Should reject zero quantity events
      await expect(
        eventProcessor.processEvent(zeroQuantityEvent, {
          forceInvoicing: true,
        }),
      ).rejects.toThrow("Event quantity must be greater than zero");
    });

    test("should handle large quantity events", async () => {
      const largeQuantityEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1000,
        metadata: { title: "Bulk Project Posting" },
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1000,
        unitPrice: 10.0,
        metadata: { title: "Bulk Project Posting" },
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventProcessor.processEvent(largeQuantityEvent, {
        forceInvoicing: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(moneyToDecimalString(result.calculation.finalAmount)).toBe(
        "9000.0000",
      ); // With bulk discount applied
    });

    test("should handle events with complex metadata", async () => {
      const complexEvent = {
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted" as const,
        quantity: 1,
        metadata: {
          title: "Complex Project",
          description: "A project with complex metadata",
          tags: ["urgent", "development", "full-time"],
          budget: { min: 1000, max: 5000, currency: "USD" },
          skills: ["javascript", "react", "node.js"],
        },
      };

      const mockCreatedEvent = {
        id: "event_1",
        entityId: "entity_1",
        userId: "user_1",
        eventType: "project_posted",
        quantity: 1,
        unitPrice: 10.0,
        metadata: complexEvent.metadata,
      };

      mockPrisma.marketplaceEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventProcessor.processEvent(complexEvent, {
        forceInvoicing: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event_1");
      expect(result.calculation.finalAmount).toBeDefined();
    });
  });
});
