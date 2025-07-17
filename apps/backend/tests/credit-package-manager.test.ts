// PrismaClient is used for type definitions only
// import { PrismaClient } from "@prisma/client";
import { CreditPackageManager } from "../src/services/billing/CreditPackageManager";
import {
  createMoney,
  moneyToDecimalString,
  CreditType,
} from "@marketplace/shared";

// Mock Prisma for testing
const mockPrisma = {
  creditPackage: {
    findUnique: jest.fn(),
  },
  entityCreditBalance: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  entityUser: {
    findFirst: jest.fn(),
  },
  credit: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
} as Record<string, any>;

describe("CreditPackageManager", () => {
  let creditManager: CreditPackageManager;

  beforeEach(() => {
    jest.clearAllMocks();
    creditManager = new CreditPackageManager(mockPrisma as any);
  });

  describe("Credit Package Purchase", () => {
    test("should successfully purchase a credit package for an entity", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      const mockCreditPackage = {
        id: packageId,
        name: "Small Package",
        creditsAmount: 100.0,
        price: 50.0,
        active: true,
      };

      mockPrisma.creditPackage.findUnique.mockResolvedValue(mockCreditPackage);
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);
      mockPrisma.entityCreditBalance.create.mockResolvedValue({
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 0.0,
      });

      const result = await creditManager.purchaseCreditPackage(
        entityId,
        packageId,
        purchasedBy,
      );

      expect(result.packageId).toBe(packageId);
      expect(result.entityId).toBe(entityId);
      expect(moneyToDecimalString(result.creditsAmount)).toBe("100.0000");
      expect(moneyToDecimalString(result.price)).toBe("50.0000");
      expect(result.purchasedAt).toBeInstanceOf(Date);

      expect(mockPrisma.entityCreditBalance.create).toHaveBeenCalledWith({
        data: {
          entityId,
          totalCredits: 100.0,
          usedCredits: 0,
        },
      });
    });

    test("should add credits to existing balance", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      const mockCreditPackage = {
        id: packageId,
        name: "Small Package",
        creditsAmount: 50.0,
        price: 25.0,
        active: true,
      };

      const existingBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      mockPrisma.creditPackage.findUnique.mockResolvedValue(mockCreditPackage);
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(
        existingBalance,
      );
      mockPrisma.entityCreditBalance.update.mockResolvedValue({
        ...existingBalance,
        totalCredits: 150.0,
      });

      const result = await creditManager.purchaseCreditPackage(
        entityId,
        packageId,
        purchasedBy,
      );

      expect(moneyToDecimalString(result.creditsAmount)).toBe("50.0000");
      expect(mockPrisma.entityCreditBalance.update).toHaveBeenCalledWith({
        where: { id: existingBalance.id },
        data: {
          totalCredits: {
            increment: 50.0,
          },
        },
      });
    });

    test("should reject purchase for inactive package", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      mockPrisma.creditPackage.findUnique.mockResolvedValue(null);

      await expect(
        creditManager.purchaseCreditPackage(entityId, packageId, purchasedBy),
      ).rejects.toThrow("Credit package package_1 not found or inactive");
    });
  });

  describe("Entity Credit Balance", () => {
    test("should get entity credit balance", async () => {
      const entityId = "entity_1";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);

      const result = await creditManager.getEntityCreditBalance(entityId);

      expect(result).not.toBeNull();
      expect(result!.entityId).toBe(entityId);
      expect(moneyToDecimalString(result!.totalCredits)).toBe("100.0000");
      expect(moneyToDecimalString(result!.usedCredits)).toBe("30.0000");
      expect(moneyToDecimalString(result!.availableCredits)).toBe("70.0000");
    });

    test("should return null for non-existent entity balance", async () => {
      const entityId = "entity_1";

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);

      const result = await creditManager.getEntityCreditBalance(entityId);

      expect(result).toBeNull();
    });
  });

  describe("Credit Deduction", () => {
    test("should successfully deduct credits for an event", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");
      const description = "Project posting fee";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      const mockEntityUser = {
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 50.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(mockEntityUser);
      mockPrisma.entityCreditBalance.update.mockResolvedValue({
        ...mockBalance,
        usedCredits: 40.0,
      });

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(true);
      expect(moneyToDecimalString(result.deductedAmount)).toBe("10.0000");
      expect(moneyToDecimalString(result.remainingBalance)).toBe("60.0000");

      expect(mockPrisma.entityCreditBalance.update).toHaveBeenCalledWith({
        where: { id: mockBalance.id },
        data: {
          usedCredits: {
            increment: 10.0,
          },
        },
      });
    });

    test("should fail deduction when insufficient credits", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("80.00");
      const description = "Project posting fee";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      const mockEntityUser = {
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 100.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(mockEntityUser);

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain("Insufficient credits");
      expect(mockPrisma.entityCreditBalance.update).not.toHaveBeenCalled();
    });

    test("should fail deduction when user credit limit exceeded", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");
      const description = "Project posting fee";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      const mockEntityUser = {
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 5.0, // User credit limit is lower than requested amount
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(mockEntityUser);

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain("Credit amount exceeds user limit");
      expect(mockPrisma.entityCreditBalance.update).not.toHaveBeenCalled();
    });

    test("should fail deduction when entity has no credit balance", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");
      const description = "Project posting fee";

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain("No credit balance found");
      expect(mockPrisma.entityCreditBalance.update).not.toHaveBeenCalled();
    });

    test("should fail deduction when user not found in entity", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("10.00");
      const description = "Project posting fee";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(null);
      mockPrisma.entityCreditBalance.update.mockResolvedValue({
        ...mockBalance,
        usedCredits: 40.0,
      });

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(true); // Should succeed even without entityUser
      expect(mockPrisma.entityCreditBalance.update).toHaveBeenCalled();
    });
  });

  describe("Legacy Credit Management", () => {
    test("should create credit with proper types", async () => {
      const customerId = "customer_1";
      const amount = createMoney("50.00");
      const description = "Promotional credit";

      const mockCreatedCredit = {
        id: "credit_1",
        customerId,
        amount: 50.0,
        type: CreditType.PROMOTIONAL,
        description,
        appliedAt: null,
      };

      mockPrisma.credit.create.mockResolvedValue(mockCreatedCredit);

      const result = await creditManager.createCredit({
        customerId,
        amount,
        type: CreditType.PROMOTIONAL,
        description,
      });

      expect(result.id).toBe("credit_1");
      expect(result.customerId).toBe(customerId);
      expect(result.type).toBe(CreditType.PROMOTIONAL);
      expect(mockPrisma.credit.create).toHaveBeenCalledWith({
        data: {
          customerId,
          amount: "50.0000",
          type: CreditType.PROMOTIONAL,
          description,
          metadata: null,
        },
      });
    });

    test("should get credit balance for customer", async () => {
      const customerId = "customer_1";

      const mockCredits = [
        {
          id: "credit_1",
          customerId,
          amount: 30.0,
          type: CreditType.PROMOTIONAL,
          appliedAt: null,
        },
        {
          id: "credit_2",
          customerId,
          amount: 20.0,
          type: CreditType.MANUAL,
          appliedAt: new Date(),
        },
      ];

      mockPrisma.credit.findMany.mockResolvedValue(mockCredits);

      const result = await creditManager.getCreditBalance(customerId);

      expect(moneyToDecimalString(result.totalAvailable)).toBe("30.0000");
      expect(moneyToDecimalString(result.totalApplied)).toBe("20.0000");
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].type).toBe(CreditType.PROMOTIONAL);
      expect(result.breakdown[1].type).toBe(CreditType.MANUAL);
    });

    test("should apply credits to invoice correctly", async () => {
      const customerId = "customer_1";
      const invoiceAmount = createMoney("100.00");
      const invoiceId = "invoice_1";

      const mockCredits = [
        {
          id: "credit_1",
          customerId,
          amount: 30.0,
          type: CreditType.PROMOTIONAL,
          appliedAt: null,
          createdAt: new Date("2025-01-01"),
        },
        {
          id: "credit_2",
          customerId,
          amount: 40.0,
          type: CreditType.MANUAL,
          appliedAt: null,
          createdAt: new Date("2025-01-02"),
        },
      ];

      mockPrisma.credit.findMany.mockResolvedValue(mockCredits);
      mockPrisma.credit.update.mockResolvedValue(mockCredits[0]);
      mockPrisma.credit.findUnique.mockResolvedValue(mockCredits[0]);
      mockPrisma.credit.create.mockResolvedValue(mockCredits[1]);

      const result = await creditManager.applyCreditsToInvoice(
        customerId,
        invoiceAmount,
        invoiceId,
      );

      expect(moneyToDecimalString(result.totalCreditsApplied)).toBe("70.0000");
      expect(moneyToDecimalString(result.remainingInvoiceAmount)).toBe(
        "30.0000",
      );
      expect(result.applications).toHaveLength(2);
      expect(result.applications[0].fullyConsumed).toBe(true);
      expect(result.applications[1].fullyConsumed).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero credit amounts", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("0.00");
      const description = "Zero amount test";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      const mockEntityUser = {
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 50.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(mockEntityUser);

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(true);
      expect(moneyToDecimalString(result.deductedAmount)).toBe("0.0000");
      expect(moneyToDecimalString(result.remainingBalance)).toBe("70.0000");
    });

    test("should handle precise decimal amounts", async () => {
      const entityId = "entity_1";
      const userId = "user_1";
      const eventType = "project_posted";
      const creditAmount = createMoney("0.01");
      const description = "Minimal amount test";

      const mockBalance = {
        id: "balance_1",
        entityId,
        totalCredits: 100.0,
        usedCredits: 30.0,
      };

      const mockEntityUser = {
        id: "entityuser_1",
        entityId,
        userId,
        creditLimit: 50.0,
      };

      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(mockBalance);
      mockPrisma.entityUser.findFirst.mockResolvedValue(mockEntityUser);
      mockPrisma.entityCreditBalance.update.mockResolvedValue({
        ...mockBalance,
        usedCredits: 30.01,
      });

      const result = await creditManager.deductCreditsForEvent(
        entityId,
        userId,
        eventType,
        creditAmount,
        description,
      );

      expect(result.success).toBe(true);
      expect(moneyToDecimalString(result.deductedAmount)).toBe("0.0100");
      expect(moneyToDecimalString(result.remainingBalance)).toBe("69.9900");
    });

    test("should handle large credit amounts", async () => {
      const entityId = "entity_1";
      const packageId = "package_1";
      const purchasedBy = "user_1";

      const mockCreditPackage = {
        id: packageId,
        name: "Enterprise Package",
        creditsAmount: 1000000.0,
        price: 500000.0,
        active: true,
      };

      mockPrisma.creditPackage.findUnique.mockResolvedValue(mockCreditPackage);
      mockPrisma.entityCreditBalance.findFirst.mockResolvedValue(null);
      mockPrisma.entityCreditBalance.create.mockResolvedValue({
        id: "balance_1",
        entityId,
        totalCredits: 1000000.0,
        usedCredits: 0.0,
      });

      const result = await creditManager.purchaseCreditPackage(
        entityId,
        packageId,
        purchasedBy,
      );

      expect(moneyToDecimalString(result.creditsAmount)).toBe("1000000.0000");
      expect(moneyToDecimalString(result.price)).toBe("500000.0000");
    });
  });
});
