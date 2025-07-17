// import { PrismaClient } from "@prisma/client";
import { PayAsYouGoPricer } from "../src/services/pricing/PayAsYouGoPricer";
import { moneyToDecimalString } from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  marketplaceEvent: {
    findMany: jest.fn(),
  },
} as Record<string, any>;

describe("PayAsYouGoPricer", () => {
  let pricer: PayAsYouGoPricer;

  beforeEach(() => {
    jest.clearAllMocks();
    pricer = new PayAsYouGoPricer(mockPrisma as any);
  });

  describe("Single Event Pricing", () => {
    test("should calculate basic event pricing", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 1;

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(result.baseAmount).toBeDefined();
      expect(result.finalAmount).toBeDefined();
      expect(moneyToDecimalString(result.baseAmount)).toBe("10.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("10.0000");
    });

    test("should calculate pricing for multiple quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 5;

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(moneyToDecimalString(result.baseAmount)).toBe("50.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("50.0000");
    });

    test("should apply bulk discount for large quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 150; // Should trigger 10% bulk discount (min 100)

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(moneyToDecimalString(result.baseAmount)).toBe("1500.0000");
      expect(moneyToDecimalString(result.discountApplied)).toBe("150.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("1350.0000");
    });

    test("should not apply bulk discount for small quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 50; // Below bulk discount threshold

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(moneyToDecimalString(result.baseAmount)).toBe("500.0000");
      expect(moneyToDecimalString(result.discountApplied)).toBe("0.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("500.0000");
    });

    test("should handle different event types", async () => {
      const entityId = "entity_1";
      const eventType = "freelancer_hired";
      const quantity = 1;

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(result.baseAmount).toBeDefined();
      expect(result.finalAmount).toBeDefined();
    });
  });

  describe("Bulk Event Pricing", () => {
    test("should calculate pricing for multiple event types", async () => {
      const entityId = "entity_1";
      const events = [
        { eventType: "project_posted", quantity: 5 },
        { eventType: "freelancer_hired", quantity: 3 },
        { eventType: "project_posted", quantity: 2 },
      ];

      const results = await pricer.calculateBulkEventPricing(entityId, events);

      expect(results).toHaveLength(3);
      expect(results[0].eventType).toBe("project_posted");
      expect(results[0].quantity).toBe(5);
      expect(results[1].eventType).toBe("freelancer_hired");
      expect(results[1].quantity).toBe(3);
      expect(results[2].eventType).toBe("project_posted");
      expect(results[2].quantity).toBe(2);
    });

    test("should handle empty event array", async () => {
      const entityId = "entity_1";
      const events: Array<{ eventType: string; quantity: number }> = [];

      const results = await pricer.calculateBulkEventPricing(entityId, events);

      expect(results).toHaveLength(0);
    });

    test("should handle single event in bulk calculation", async () => {
      const entityId = "entity_1";
      const events = [{ eventType: "project_posted", quantity: 1 }];

      const results = await pricer.calculateBulkEventPricing(entityId, events);

      expect(results).toHaveLength(1);
      expect(results[0].eventType).toBe("project_posted");
      expect(results[0].quantity).toBe(1);
    });
  });

  describe("Total Cost Calculation", () => {
    test("should calculate total cost for entity over date range", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      const mockEvents = [
        {
          id: "event_1",
          entityId,
          eventType: "project_posted",
          quantity: 5,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
        },
        {
          id: "event_2",
          entityId,
          eventType: "freelancer_hired",
          quantity: 2,
          unitPrice: 25.0,
          timestamp: new Date("2025-01-20"),
        },
        {
          id: "event_3",
          entityId,
          eventType: "project_posted",
          quantity: 3,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-25"),
        },
      ];

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue(mockEvents);

      const totalCost = await pricer.getTotalEventCost(
        entityId,
        fromDate,
        toDate,
      );

      expect(mockPrisma.marketplaceEvent.findMany).toHaveBeenCalledWith({
        where: {
          entityId,
          timestamp: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });

      // Should calculate: (5+3) * $10 + 2 * $10 = $80 + $20 = $100
      expect(moneyToDecimalString(totalCost)).toBe("100.0000");
    });

    test("should handle no events for date range", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue([]);

      const totalCost = await pricer.getTotalEventCost(
        entityId,
        fromDate,
        toDate,
      );

      expect(moneyToDecimalString(totalCost)).toBe("0.0000");
    });

    test("should aggregate events of same type correctly", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      const mockEvents = [
        {
          id: "event_1",
          entityId,
          eventType: "project_posted",
          quantity: 10,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-15"),
        },
        {
          id: "event_2",
          entityId,
          eventType: "project_posted",
          quantity: 20,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-20"),
        },
        {
          id: "event_3",
          entityId,
          eventType: "project_posted",
          quantity: 80,
          unitPrice: 10.0,
          timestamp: new Date("2025-01-25"),
        },
      ];

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue(mockEvents);

      const totalCost = await pricer.getTotalEventCost(
        entityId,
        fromDate,
        toDate,
      );

      // Should aggregate to 110 total project_posted events
      // With bulk discount applied: $1100 - $110 = $990
      expect(moneyToDecimalString(totalCost)).toBe("990.0000");
    });
  });

  describe("Tiered Pricing", () => {
    test("should apply tier 1 pricing for small quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 50; // Should be in tier 1 (limit 100)

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.tier).toBe(1);
      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
    });

    test("should apply tier 2 pricing for medium quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 300; // Should be in tier 2 (limit 500)

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.tier).toBe(2);
      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
    });

    test("should apply tier 3 pricing for large quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 1000; // Should be in tier 3 (unlimited)

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.tier).toBe(3);
      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero quantity", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 0;

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(moneyToDecimalString(result.baseAmount)).toBe("0.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("0.0000");
    });

    test("should handle very large quantities", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 10000; // Very large quantity

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(result.baseAmount).toBeDefined();
      expect(result.finalAmount).toBeDefined();
      expect(result.tier).toBe(3); // Should be in highest tier
    });

    test("should handle negative quantities gracefully", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = -1;

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      // Should still calculate (even though negative)
      expect(result.baseAmount).toBeDefined();
      expect(result.finalAmount).toBeDefined();
    });

    test("should handle precision in discount calculations", async () => {
      const entityId = "entity_1";
      const eventType = "project_posted";
      const quantity = 101; // Just above bulk discount threshold

      const result = await pricer.calculateEventPricing(
        entityId,
        eventType,
        quantity,
      );

      expect(result.eventType).toBe(eventType);
      expect(result.quantity).toBe(quantity);
      expect(moneyToDecimalString(result.baseAmount)).toBe("1010.0000");
      expect(moneyToDecimalString(result.discountApplied)).toBe("101.0000");
      expect(moneyToDecimalString(result.finalAmount)).toBe("909.0000");
    });
  });

  describe("Pricing Configuration", () => {
    test("should use configured base price for different event types", async () => {
      const entityId = "entity_1";
      const projectPostedResult = await pricer.calculateEventPricing(
        entityId,
        "project_posted",
        1,
      );

      const freelancerHiredResult = await pricer.calculateEventPricing(
        entityId,
        "freelancer_hired",
        1,
      );

      // Both should use the same base price in our simplified implementation
      expect(projectPostedResult.baseAmount).toBeDefined();
      expect(freelancerHiredResult.baseAmount).toBeDefined();
    });

    test("should apply bulk discounts consistently across different entities", async () => {
      const quantity = 150; // Should trigger bulk discount
      const eventType = "project_posted";

      const entity1Result = await pricer.calculateEventPricing(
        "entity_1",
        eventType,
        quantity,
      );

      const entity2Result = await pricer.calculateEventPricing(
        "entity_2",
        eventType,
        quantity,
      );

      // Should apply same discount logic
      expect(entity1Result.discountApplied).toBeDefined();
      expect(entity2Result.discountApplied).toBeDefined();
      expect(moneyToDecimalString(entity1Result.discountApplied)).toBe(
        moneyToDecimalString(entity2Result.discountApplied),
      );
    });
  });

  describe("Performance", () => {
    test("should handle bulk calculations efficiently", async () => {
      const entityId = "entity_1";
      const events = Array.from({ length: 100 }, (_, i) => ({
        eventType: i % 2 === 0 ? "project_posted" : "freelancer_hired",
        quantity: Math.floor(Math.random() * 10) + 1,
      }));

      const startTime = Date.now();
      const results = await pricer.calculateBulkEventPricing(entityId, events);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test("should handle large date range queries efficiently", async () => {
      const entityId = "entity_1";
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-12-31");

      // Mock many events
      const mockEvents = Array.from({ length: 1000 }, (_, i) => ({
        id: `event_${i}`,
        entityId,
        eventType: i % 2 === 0 ? "project_posted" : "freelancer_hired",
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: 10.0,
        timestamp: new Date(2024, Math.floor(Math.random() * 12), 1),
      }));

      mockPrisma.marketplaceEvent.findMany.mockResolvedValue(mockEvents);

      const startTime = Date.now();
      const totalCost = await pricer.getTotalEventCost(
        entityId,
        fromDate,
        toDate,
      );
      const endTime = Date.now();

      expect(totalCost).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
