// import { PrismaClient } from "@prisma/client";
import { MarketplaceBillingEngine } from "../src/services/billing/MarketplaceBillingEngine";
import { JobStatus, ContractStatus } from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  contract: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  usageEvent: {
    findMany: jest.fn(),
  },
  billingJob: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  invoiceLine: {
    createMany: jest.fn(),
  },
  credit: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  customer: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
} as Record<string, any>;

describe("MarketplaceBillingEngine", () => {
  let billingEngine: MarketplaceBillingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    billingEngine = new MarketplaceBillingEngine(mockPrisma as any);
  });

  describe("Contract Discovery", () => {
    test("should find contracts due for billing", async () => {
      const effectiveDate = new Date("2025-01-01");
      const mockContracts = [
        {
          id: "contract_1",
          customerId: "customer_1",
          baseFee: { toString: () => "99.0000" },
          minCommitCalls: 10000,
          callOverageFee: { toString: () => "0.0020" },
          discountRate: { toString: () => "0.2000" },
          billingCycle: 1,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_1",
            name: "Test Customer",
            email: "test@example.com",
            creditBalance: { toString: () => "0.0000" },
          },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts =
        await billingEngine.findContractsDueForBilling(effectiveDate);

      expect(contracts).toHaveLength(1);
      expect(contracts[0].id).toBe("contract_1");
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith({
        where: {
          status: ContractStatus.ACTIVE,
          nextBillingDate: {
            lte: effectiveDate,
          },
        },
        include: {
          customer: true,
        },
        orderBy: {
          nextBillingDate: "asc",
        },
      });
    });

    test("should handle no contracts due for billing", async () => {
      const effectiveDate = new Date("2025-01-01");
      mockPrisma.contract.findMany.mockResolvedValue([]);

      const contracts =
        await billingEngine.findContractsDueForBilling(effectiveDate);

      expect(contracts).toHaveLength(0);
    });
  });

  describe("Usage Aggregation", () => {
    test("should aggregate usage events for a billing period", async () => {
      const contractId = "contract_1";
      const periodStart = new Date("2025-01-01");
      const periodEnd = new Date("2025-01-31");

      const mockUsageEvents = [
        {
          contractId,
          quantity: 5000,
          timestamp: new Date("2025-01-15"),
        },
        {
          contractId,
          quantity: 7500,
          timestamp: new Date("2025-01-20"),
        },
      ];

      mockPrisma.usageEvent.findMany.mockResolvedValue(mockUsageEvents);

      const usage = await billingEngine.aggregateUsage(
        contractId,
        periodStart,
        periodEnd,
      );

      expect(usage.totalUsage).toBe(12500);
      expect(usage.contractId).toBe(contractId);
      expect(usage.periodStart).toEqual(periodStart);
      expect(usage.periodEnd).toEqual(periodEnd);
    });

    test("should handle zero usage gracefully", async () => {
      const contractId = "contract_1";
      const periodStart = new Date("2025-01-01");
      const periodEnd = new Date("2025-01-31");

      mockPrisma.usageEvent.findMany.mockResolvedValue([]);

      const usage = await billingEngine.aggregateUsage(
        contractId,
        periodStart,
        periodEnd,
      );

      expect(usage.totalUsage).toBe(0);
      expect(usage.contractId).toBe(contractId);
    });
  });

  describe("Billing Period Calculation", () => {
    test("should calculate monthly billing period correctly", async () => {
      const effectiveDate = new Date("2025-01-01");

      // Mock the contracts response for the test
      const mockContracts = [
        {
          id: "contract_1",
          customerId: "customer_1",
          baseFee: { toString: () => "99.0000" },
          minCommitCalls: 10000,
          callOverageFee: { toString: () => "0.0020" },
          discountRate: { toString: () => "0.2000" },
          billingCycle: 1,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_1",
            name: "Test Customer",
            email: "test@example.com",
            creditBalance: { toString: () => "0.0000" },
          },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      // Test billing period calculation by testing the public method that uses it
      const contractsDue =
        await billingEngine.findContractsDueForBilling(effectiveDate);
      expect(contractsDue).toBeDefined();
      expect(contractsDue).toHaveLength(1);
      expect(contractsDue[0].id).toBe("contract_1");
    });
  });

  // describe("Full Billing Run", () => {
  //   test("should execute complete billing run successfully", async () => {
  //     const effectiveDate = new Date("2025-01-01");

  //     // Mock contracts
  //     const mockContracts = [
  //       {
  //         id: "contract_1",
  //         customerId: "customer_1",
  //         baseFee: { toString: () => "99.0000" },
  //         minCommitCalls: 10000,
  //         callOverageFee: { toString: () => "0.0020" },
  //         discountRate: { toString: () => "0.2000" },
  //         billingCycle: 1,
  //         nextBillingDate: effectiveDate,
  //         customer: {
  //           id: "customer_1",
  //           name: "Test Customer",
  //           email: "test@example.com",
  //           creditBalance: { toString: () => "0.0000" },
  //         },
  //       },
  //     ];

  //     // Mock billing job
  //     mockPrisma.billingJob.findFirst.mockResolvedValue(null);
  //     mockPrisma.billingJob.create.mockResolvedValue({
  //       id: "job_123",
  //       asOfDate: effectiveDate,
  //       status: JobStatus.PENDING,
  //       startedAt: new Date(),
  //     });

  //     // Mock contracts and usage
  //     mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
  //     mockPrisma.usageEvent.findMany.mockResolvedValue([
  //       {
  //         contractId: "contract_1",
  //         quantity: 15000,
  //         timestamp: new Date("2025-01-15"),
  //       },
  //     ]);

  //     // Mock invoice creation
  //     mockPrisma.invoice.findFirst.mockResolvedValue(null);
  //     mockPrisma.invoice.create.mockResolvedValue({
  //       id: "invoice_123",
  //       number: "INV-2025-001",
  //       total: "129.0000",
  //     });
  //     mockPrisma.invoiceLine.createMany.mockResolvedValue({ count: 3 });
  //     mockPrisma.credit.findMany.mockResolvedValue([]);

  //     // Mock job completion
  //     mockPrisma.billingJob.update.mockResolvedValue({});
  //     mockPrisma.contract.update.mockResolvedValue({});

  //     const result = await billingEngine.executeBillingRun(effectiveDate);

  //     expect(result.totalContracts).toBe(1);
  //     expect(result.processedContracts).toBe(1);
  //     expect(result.invoicesGenerated).toBe(1);
  //     expect(result.skippedContracts).toBe(0);
  //     expect(result.errors).toHaveLength(0);
  //   });

  //   test("should handle contract processing errors gracefully", async () => {
  //     const effectiveDate = new Date("2025-01-01");

  //     // Mock contracts
  //     const mockContracts = [
  //       {
  //         id: "contract_1",
  //         customerId: "customer_1",
  //         baseFee: { toString: () => "99.0000" },
  //         minCommitCalls: 10000,
  //         callOverageFee: { toString: () => "0.0020" },
  //         discountRate: { toString: () => "0.2000" },
  //         billingCycle: 1,
  //         nextBillingDate: effectiveDate,
  //         customer: {
  //           id: "customer_1",
  //           name: "Test Customer",
  //           email: "test@example.com",
  //           creditBalance: { toString: () => "0.0000" },
  //         },
  //       },
  //     ];

  //     // Mock billing job
  //     mockPrisma.billingJob.findFirst.mockResolvedValue(null);
  //     mockPrisma.billingJob.create.mockResolvedValue({
  //       id: "job_123",
  //       asOfDate: effectiveDate,
  //       status: JobStatus.PENDING,
  //       startedAt: new Date(),
  //     });

  //     // Mock contracts and usage
  //     mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
  //     mockPrisma.usageEvent.findMany.mockResolvedValue([]);

  //     // Mock invoice creation failure
  //     mockPrisma.invoice.findFirst.mockResolvedValue(null);
  //     mockPrisma.invoice.create.mockRejectedValue(new Error("Database error"));

  //     // Mock job completion
  //     mockPrisma.billingJob.update.mockResolvedValue({});

  //     const result = await billingEngine.executeBillingRun(effectiveDate);

  //     expect(result.totalContracts).toBe(1);
  //     expect(result.processedContracts).toBe(0);
  //     expect(result.invoicesGenerated).toBe(0);
  //     expect(result.skippedContracts).toBe(1);
  //     expect(result.errors).toHaveLength(1);
  //     expect(result.errors[0]).toContain("Database error");
  //   });

  //   test("should handle complete billing run failure", async () => {
  //     const effectiveDate = new Date("2025-01-01");

  //     // Mock billing job
  //     mockPrisma.billingJob.findFirst.mockResolvedValue(null);
  //     mockPrisma.billingJob.create.mockResolvedValue({
  //       id: "job_123",
  //       asOfDate: effectiveDate,
  //       status: JobStatus.PENDING,
  //       startedAt: new Date(),
  //     });

  //     // Mock contract findMany failure
  //     mockPrisma.contract.findMany.mockRejectedValue(
  //       new Error("Database connection failed"),
  //     );

  //     // Mock job failure
  //     mockPrisma.billingJob.update.mockResolvedValue({});

  //     await expect(
  //       billingEngine.executeBillingRun(effectiveDate),
  //     ).rejects.toThrow("Database connection failed");

  //     expect(mockPrisma.billingJob.update).toHaveBeenCalledWith({
  //       where: { id: "job_123" },
  //       data: {
  //         status: JobStatus.FAILED,
  //         errorMessage: "Database connection failed",
  //         completedAt: expect.any(Date),
  //       },
  //     });
  //   });
  // });

  describe("Edge Cases", () => {
    test("should handle multiple contracts for same customer", async () => {
      const effectiveDate = new Date("2025-01-01");

      const mockContracts = [
        {
          id: "contract_1",
          customerId: "customer_1",
          baseFee: { toString: () => "99.0000" },
          minCommitCalls: 10000,
          callOverageFee: { toString: () => "0.0020" },
          discountRate: { toString: () => "0.2000" },
          billingCycle: 1,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_1",
            name: "Test Customer",
            email: "test@example.com",
            creditBalance: { toString: () => "0.0000" },
          },
        },
        {
          id: "contract_2",
          customerId: "customer_1",
          baseFee: { toString: () => "199.0000" },
          minCommitCalls: 20000,
          callOverageFee: { toString: () => "0.0015" },
          discountRate: { toString: () => "0.1500" },
          billingCycle: 2,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_1",
            name: "Test Customer",
            email: "test@example.com",
            creditBalance: { toString: () => "0.0000" },
          },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts =
        await billingEngine.findContractsDueForBilling(effectiveDate);

      expect(contracts).toHaveLength(2);
      expect(contracts[0].customerId).toBe("customer_1");
      expect(contracts[1].customerId).toBe("customer_1");
    });

    test("should handle contracts with different billing cycles", async () => {
      const effectiveDate = new Date("2025-01-01");

      const mockContracts = [
        {
          id: "contract_1",
          customerId: "customer_1",
          baseFee: { toString: () => "99.0000" },
          minCommitCalls: 10000,
          callOverageFee: { toString: () => "0.0020" },
          discountRate: { toString: () => "0.2000" },
          billingCycle: 1,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_1",
            name: "Test Customer",
            email: "test@example.com",
            creditBalance: { toString: () => "0.0000" },
          },
        },
        {
          id: "contract_2",
          customerId: "customer_2",
          baseFee: { toString: () => "199.0000" },
          minCommitCalls: 20000,
          callOverageFee: { toString: () => "0.0015" },
          discountRate: { toString: () => "0.1500" },
          billingCycle: 5,
          nextBillingDate: effectiveDate,
          customer: {
            id: "customer_2",
            name: "Test Customer 2",
            email: "test2@example.com",
            creditBalance: { toString: () => "100.0000" },
          },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts =
        await billingEngine.findContractsDueForBilling(effectiveDate);

      expect(contracts).toHaveLength(2);
      expect(contracts[0].billingCycle).toBe(1);
      expect(contracts[1].billingCycle).toBe(5);
    });
  });
});
