import { PrismaClient } from "@prisma/client";
import {
  Money,
  createMoney,
  addMoney,
  subtractMoney,
  moneyFromDecimalString,
  moneyToDecimalString,
  CreditType,
} from "@marketplace/shared";

export interface CreditApplication {
  creditId: string;
  amount: Money;
  appliedAmount: Money;
  remainingAmount: Money;
  fullyConsumed: boolean;
}

export interface CreditRule {
  id: string;
  name: string;
  priority: number; // Lower number = higher priority
  conditions?: CreditCondition[];
  expirationDays?: number; // Days until credit expires
  maxApplicationPerInvoice?: Money; // Maximum credit that can be applied per invoice
  applicableToTypes?: string[]; // Which invoice line types this applies to
  metadata?: Record<string, any>;
}

export interface CreditCondition {
  field: "customer_type" | "invoice_amount" | "credit_age" | "billing_cycle";
  operator: "eq" | "gte" | "lte" | "gt" | "lt" | "in";
  value: any;
}

export interface CreditApplicationResult {
  totalCreditsApplied: Money;
  applications: CreditApplication[];
  remainingInvoiceAmount: Money;
  expiredCredits: string[]; // IDs of credits that expired during application
  unusedCredits: string[]; // IDs of credits that couldn't be applied
}

export interface CreditBalance {
  totalAvailable: Money;
  totalApplied: Money;
  totalExpired: Money;
  breakdown: Array<{
    creditId: string;
    type: CreditType;
    amount: Money;
    remainingAmount: Money;
    expiresAt?: Date;
    appliedAt?: Date;
  }>;
}

export interface EntityCreditBalance {
  entityId: string;
  totalCredits: Money;
  usedCredits: Money;
  availableCredits: Money;
  expiresAt?: Date;
}

export interface CreditPackagePurchase {
  packageId: string;
  entityId: string;
  creditsAmount: Money;
  price: Money;
  expiresAt: Date;
  purchasedAt: Date;
}

export interface CreditDeductionResult {
  success: boolean;
  deductedAmount: Money;
  remainingBalance: Money;
  reason?: string;
}

/**
 * Enhanced credit management with flexible rules and advanced application logic
 */
export class CreditPackageManager {
  private rules: Map<string, CreditRule> = new Map();

  constructor(private prisma: PrismaClient) {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default credit application rules
   */
  private initializeDefaultRules(): void {
    // FIFO rule - apply oldest credits first
    this.addRule({
      id: "fifo",
      name: "First In, First Out",
      priority: 1,
    });

    // Promotional credits expire first
    this.addRule({
      id: "promotional_first",
      name: "Apply Promotional Credits First",
      priority: 0,
      conditions: [
        {
          field: "credit_age",
          operator: "gte",
          value: 0,
        },
      ],
    });
  }

  // ===== ENTITY-LEVEL CREDIT PACKAGE MANAGEMENT =====

  /**
   * Purchase a credit package for an entity
   */
  async purchaseCreditPackage(
    entityId: string,
    packageId: string,
    purchasedBy: string,
  ): Promise<CreditPackagePurchase> {
    // Get the credit package details
    const creditPackage = await this.prisma.creditPackage.findUnique({
      where: { id: packageId, active: true },
    });

    if (!creditPackage) {
      throw new Error(`Credit package ${packageId} not found or inactive`);
    }

    const creditsAmount = moneyFromDecimalString(
      creditPackage.creditsAmount.toString(),
    );
    const price = moneyFromDecimalString(creditPackage.price.toString());
    const expiresAt = new Date(
      Date.now() + creditPackage.validityDays * 24 * 60 * 60 * 1000,
    );

    // Create or update entity credit balance
    const existingBalance = await this.prisma.entityCreditBalance.findFirst({
      where: { entityId },
    });

    if (existingBalance) {
      // Add to existing balance
      await this.prisma.entityCreditBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalCredits: {
            increment: creditsAmount.amount.toNumber(),
          },
          expiresAt: expiresAt, // Update expiration to latest purchase
        },
      });
    } else {
      // Create new balance
      await this.prisma.entityCreditBalance.create({
        data: {
          entityId,
          totalCredits: creditsAmount.amount.toNumber(),
          usedCredits: 0,
          expiresAt,
        },
      });
    }

    return {
      packageId,
      entityId,
      creditsAmount,
      price,
      expiresAt,
      purchasedAt: new Date(),
    };
  }

  /**
   * Get credit balance for an entity
   */
  async getEntityCreditBalance(
    entityId: string,
  ): Promise<EntityCreditBalance | null> {
    const balance = await this.prisma.entityCreditBalance.findFirst({
      where: { entityId },
    });

    if (!balance) {
      return null;
    }

    const totalCredits = moneyFromDecimalString(
      balance.totalCredits.toString(),
    );
    const usedCredits = moneyFromDecimalString(balance.usedCredits.toString());
    const availableCredits = subtractMoney(totalCredits, usedCredits);

    return {
      entityId,
      totalCredits,
      usedCredits,
      availableCredits,
      expiresAt: balance.expiresAt || undefined,
    };
  }

  /**
   * Deduct credits from entity balance for a marketplace event
   */
  async deductCreditsForEvent(
    entityId: string,
    userId: string,
    eventType: string,
    creditAmount: Money,
    reason: string,
  ): Promise<CreditDeductionResult> {
    const balance = await this.getEntityCreditBalance(entityId);

    if (!balance) {
      return {
        success: false,
        deductedAmount: createMoney("0"),
        remainingBalance: createMoney("0"),
        reason: "No credit balance found for entity",
      };
    }

    // Check if entity has sufficient credits
    if (balance.availableCredits.amount.lessThan(creditAmount.amount)) {
      return {
        success: false,
        deductedAmount: createMoney("0"),
        remainingBalance: balance.availableCredits,
        reason: "Insufficient credits",
      };
    }

    // Check credit limit for user within entity
    const entityUser = await this.prisma.entityUser.findFirst({
      where: { entityId, userId },
    });

    if (entityUser) {
      const userCreditLimit = moneyFromDecimalString(
        entityUser.creditLimit.toString(),
      );
      if (
        userCreditLimit.amount.greaterThan(0) &&
        creditAmount.amount.greaterThan(userCreditLimit.amount)
      ) {
        return {
          success: false,
          deductedAmount: createMoney("0"),
          remainingBalance: balance.availableCredits,
          reason: "Credit amount exceeds user limit",
        };
      }
    }

    // Deduct credits
    await this.prisma.entityCreditBalance.update({
      where: {
        id: (await this.prisma.entityCreditBalance.findFirst({
          where: { entityId },
        }))!.id,
      },
      data: {
        usedCredits: {
          increment: creditAmount.amount.toNumber(),
        },
      },
    });

    const newRemainingBalance = subtractMoney(
      balance.availableCredits,
      creditAmount,
    );

    return {
      success: true,
      deductedAmount: creditAmount,
      remainingBalance: newRemainingBalance,
    };
  }

  /**
   * Get all available credit packages
   */
  async getAvailableCreditPackages(): Promise<any[]> {
    return this.prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
  }

  /**
   * Check if entity credits are expiring soon (within 30 days)
   */
  async getExpiringCredits(entityId: string): Promise<boolean> {
    const balance = await this.getEntityCreditBalance(entityId);

    if (!balance || !balance.expiresAt) {
      return false;
    }

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return balance.expiresAt <= thirtyDaysFromNow;
  }

  /**
   * Add a credit application rule
   */
  addRule(rule: CreditRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a credit application rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Apply credits to an invoice with enhanced logic
   */
  async applyCreditsToInvoice(
    customerId: string,
    invoiceAmount: Money,
    invoiceId?: string,
    lineTypes?: string[],
  ): Promise<CreditApplicationResult> {
    // Get available credits for the customer
    const availableCredits = await this.getAvailableCredits(customerId);

    // Remove expired credits
    const { validCredits, expiredCredits } =
      this.filterExpiredCredits(availableCredits);

    // Mark expired credits in database
    if (expiredCredits.length > 0) {
      await this.markCreditsAsExpired(expiredCredits.map((c) => c.id));
    }

    // Sort credits according to application rules
    const sortedCredits = this.sortCreditsByRules(validCredits);

    let remainingInvoiceAmount = invoiceAmount;
    const applications: CreditApplication[] = [];
    const unusedCredits: string[] = [];

    for (const credit of sortedCredits) {
      if (remainingInvoiceAmount.amount.lessThanOrEqualTo(0)) {
        unusedCredits.push(credit.id);
        continue;
      }

      // Check if credit can be applied based on rules
      if (!this.canApplyCredit(credit, invoiceAmount, lineTypes)) {
        unusedCredits.push(credit.id);
        continue;
      }

      const creditAmount = moneyFromDecimalString(credit.amount);
      const applicableAmount = {
        amount: creditAmount.amount.lessThanOrEqualTo(
          remainingInvoiceAmount.amount,
        )
          ? creditAmount.amount
          : remainingInvoiceAmount.amount,
        currency: creditAmount.currency,
      };

      const application: CreditApplication = {
        creditId: credit.id,
        amount: creditAmount,
        appliedAmount: applicableAmount,
        remainingAmount: subtractMoney(creditAmount, applicableAmount),
        fullyConsumed: applicableAmount.amount.equals(creditAmount.amount),
      };

      applications.push(application);
      remainingInvoiceAmount = subtractMoney(
        remainingInvoiceAmount,
        applicableAmount,
      );

      // Mark credit as applied or partially applied
      if (invoiceId) {
        await this.markCreditAsApplied(
          credit.id,
          applicableAmount,
          invoiceId,
          application.fullyConsumed,
        );
      }
    }

    const totalCreditsApplied = applications.reduce(
      (total, app) => addMoney(total, app.appliedAmount),
      createMoney("0", invoiceAmount.currency),
    );

    return {
      totalCreditsApplied,
      applications,
      remainingInvoiceAmount,
      expiredCredits: expiredCredits.map((c) => c.id),
      unusedCredits,
    };
  }

  /**
   * Create a new credit for a customer
   */
  async createCredit(
    customerId: string,
    amount: Money,
    type: CreditType,
    description: string,
    expirationDays?: number,
    metadata?: Record<string, any>,
  ): Promise<any> {
    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    return this.prisma.credit.create({
      data: {
        customerId,
        amount: moneyToDecimalString(amount),
        type,
        description,
        expiresAt,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Get comprehensive credit balance for a customer
   */
  async getCreditBalance(customerId: string): Promise<CreditBalance> {
    const credits = await this.prisma.credit.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });

    let totalAvailable = createMoney("0");
    let totalApplied = createMoney("0");
    let totalExpired = createMoney("0");
    const breakdown: CreditBalance["breakdown"] = [];

    for (const credit of credits) {
      const amount = moneyFromDecimalString(credit.amount.toString());
      const isExpired = credit.expiresAt && credit.expiresAt < new Date();
      const isApplied = credit.appliedAt !== null;

      if (isExpired) {
        totalExpired = addMoney(totalExpired, amount);
      } else if (isApplied) {
        totalApplied = addMoney(totalApplied, amount);
      } else {
        totalAvailable = addMoney(totalAvailable, amount);
      }

      breakdown.push({
        creditId: credit.id,
        type: credit.type as CreditType,
        amount,
        remainingAmount:
          isApplied || isExpired ? createMoney("0", amount.currency) : amount,
        expiresAt: credit.expiresAt || undefined,
        appliedAt: credit.appliedAt || undefined,
      });
    }

    return {
      totalAvailable,
      totalApplied,
      totalExpired,
      breakdown,
    };
  }

  /**
   * Issue a refund credit
   */
  async issueRefundCredit(
    customerId: string,
    refundAmount: Money,
    originalInvoiceId: string,
    reason: string,
  ): Promise<any> {
    return this.createCredit(
      customerId,
      refundAmount,
      CreditType.REFUND,
      `Refund for invoice: ${reason}`,
      365, // Refund credits expire in 1 year
      {
        originalInvoiceId,
        refundReason: reason,
        issuedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Issue a promotional credit
   */
  async issuePromotionalCredit(
    customerId: string,
    creditAmount: Money,
    promotionName: string,
    expirationDays: number = 90,
  ): Promise<any> {
    return this.createCredit(
      customerId,
      creditAmount,
      CreditType.PROMOTIONAL,
      `Promotional credit: ${promotionName}`,
      expirationDays,
      {
        promotionName,
        issuedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Transfer credits between customers
   */
  async transferCredit(
    fromCustomerId: string,
    toCustomerId: string,
    amount: Money,
    reason: string,
  ): Promise<{ debitCredit: any; creditCredit: any }> {
    // Create negative credit for source customer
    const debitCredit = await this.createCredit(
      fromCustomerId,
      createMoney(amount.amount.negated().toString(), amount.currency),
      CreditType.ADJUSTMENT,
      `Credit transfer to customer: ${reason}`,
      undefined,
      {
        transferTo: toCustomerId,
        transferReason: reason,
      },
    );

    // Create positive credit for destination customer
    const creditCredit = await this.createCredit(
      toCustomerId,
      amount,
      CreditType.ADJUSTMENT,
      `Credit transfer from customer: ${reason}`,
      undefined,
      {
        transferFrom: fromCustomerId,
        transferReason: reason,
      },
    );

    return { debitCredit, creditCredit };
  }

  /**
   * Get available credits for a customer
   */
  private async getAvailableCredits(customerId: string): Promise<any[]> {
    return this.prisma.credit.findMany({
      where: {
        customerId,
        appliedAt: null,
        amount: {
          gt: 0, // Only positive credits
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Filter out expired credits
   */
  private filterExpiredCredits(credits: any[]): {
    validCredits: any[];
    expiredCredits: any[];
  } {
    const now = new Date();
    const validCredits: any[] = [];
    const expiredCredits: any[] = [];

    for (const credit of credits) {
      if (credit.expiresAt && credit.expiresAt <= now) {
        expiredCredits.push(credit);
      } else {
        validCredits.push(credit);
      }
    }

    return { validCredits, expiredCredits };
  }

  /**
   * Sort credits according to application rules
   */
  private sortCreditsByRules(credits: any[]): any[] {
    return credits.sort((a, b) => {
      // Sort by credit type priority first (promotional > refund > manual > adjustment)
      const typePriority = {
        [CreditType.PROMOTIONAL]: 0,
        [CreditType.REFUND]: 1,
        [CreditType.MANUAL]: 2,
        [CreditType.ADJUSTMENT]: 3,
      };

      const aPriority = typePriority[a.type as CreditType] || 999;
      const bPriority = typePriority[b.type as CreditType] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by expiration date (expiring first)
      if (a.expiresAt && b.expiresAt) {
        return a.expiresAt.getTime() - b.expiresAt.getTime();
      }
      if (a.expiresAt && !b.expiresAt) {
        return -1; // Expiring credits first
      }
      if (!a.expiresAt && b.expiresAt) {
        return 1;
      }

      // Finally sort by creation date (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Check if a credit can be applied based on rules
   */
  private canApplyCredit(
    credit: any,
    invoiceAmount: Money,
    lineTypes?: string[],
  ): boolean {
    // Add rule-based logic here
    // For now, allow all credits to be applied
    return true;
  }

  /**
   * Mark credits as expired in the database
   */
  private async markCreditsAsExpired(creditIds: string[]): Promise<void> {
    if (creditIds.length === 0) return;

    await this.prisma.credit.updateMany({
      where: {
        id: { in: creditIds },
      },
      data: {
        appliedAt: new Date(), // Mark as applied to prevent further use
        metadata: {
          expiredAt: new Date().toISOString(),
          expiredReason: "Credit expired",
        },
      },
    });
  }

  /**
   * Mark a credit as applied
   */
  private async markCreditAsApplied(
    creditId: string,
    appliedAmount: Money,
    invoiceId: string,
    fullyConsumed: boolean,
  ): Promise<void> {
    if (fullyConsumed) {
      // Mark entire credit as applied
      await this.prisma.credit.update({
        where: { id: creditId },
        data: {
          appliedAt: new Date(),
          metadata: {
            appliedToInvoice: invoiceId,
            appliedAmount: moneyToDecimalString(appliedAmount),
            fullyConsumed: true,
          },
        },
      });
    } else {
      // For partial application, we need to create a new credit for the remaining amount
      // and mark the original as fully applied
      const originalCredit = await this.prisma.credit.findUnique({
        where: { id: creditId },
      });

      if (originalCredit) {
        const originalAmount = moneyFromDecimalString(
          originalCredit.amount.toString(),
        );
        const remainingAmount = subtractMoney(originalAmount, appliedAmount);

        // Create new credit for remaining amount
        await this.prisma.credit.create({
          data: {
            customerId: originalCredit.customerId,
            amount: moneyToDecimalString(remainingAmount),
            type: originalCredit.type,
            description: `${originalCredit.description} (remaining balance)`,
            expiresAt: originalCredit.expiresAt,
            metadata: {
              ...(originalCredit.metadata
                ? JSON.parse(JSON.stringify(originalCredit.metadata))
                : {}),
              originalCreditId: creditId,
              splitFromApplication: invoiceId,
            },
          },
        });

        // Mark original credit as applied
        await this.prisma.credit.update({
          where: { id: creditId },
          data: {
            appliedAt: new Date(),
            metadata: {
              appliedToInvoice: invoiceId,
              appliedAmount: moneyToDecimalString(appliedAmount),
              fullyConsumed: false,
              splitRemainingCreditCreated: true,
            },
          },
        });
      }
    }
  }

  /**
   * Reverse a credit application (for invoice voids/cancellations)
   */
  async reverseCreditApplication(
    invoiceId: string,
    reason: string,
  ): Promise<any[]> {
    // Find all credits applied to this invoice
    const appliedCredits = await this.prisma.credit.findMany({
      where: {
        appliedAt: { not: null },
        metadata: {
          path: ["appliedToInvoice"],
          equals: invoiceId,
        },
      },
    });

    const reversedCredits: any[] = [];

    for (const credit of appliedCredits) {
      // Create a new credit to reverse the application
      const reversalCredit = await this.createCredit(
        credit.customerId,
        moneyFromDecimalString(credit.amount.toString()),
        CreditType.ADJUSTMENT,
        `Reversal of credit application: ${reason}`,
        undefined,
        {
          originalCreditId: credit.id,
          reversalReason: reason,
          reversedInvoiceId: invoiceId,
          reversedAt: new Date().toISOString(),
        },
      );

      reversedCredits.push(reversalCredit);
    }

    return reversedCredits;
  }

  /**
   * Get credit usage analytics for a customer
   */
  async getCreditAnalytics(
    customerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalIssued: Money;
    totalApplied: Money;
    totalExpired: Money;
    applicationsByType: Record<CreditType, Money>;
    averageApplicationAmount: Money;
    creditUtilizationRate: number; // Percentage of issued credits that were used
  }> {
    const credits = await this.prisma.credit.findMany({
      where: {
        customerId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    let totalIssued = createMoney("0");
    let totalApplied = createMoney("0");
    let totalExpired = createMoney("0");
    const applicationsByType: Record<CreditType, Money> = {
      [CreditType.MANUAL]: createMoney("0"),
      [CreditType.REFUND]: createMoney("0"),
      [CreditType.ADJUSTMENT]: createMoney("0"),
      [CreditType.PROMOTIONAL]: createMoney("0"),
    };

    let applicationsCount = 0;

    for (const credit of credits) {
      const amount = moneyFromDecimalString(credit.amount.toString());
      totalIssued = addMoney(totalIssued, amount);

      if (credit.appliedAt) {
        totalApplied = addMoney(totalApplied, amount);
        applicationsByType[credit.type as CreditType] = addMoney(
          applicationsByType[credit.type as CreditType],
          amount,
        );
        applicationsCount++;
      }

      if (
        credit.expiresAt &&
        credit.expiresAt < new Date() &&
        !credit.appliedAt
      ) {
        totalExpired = addMoney(totalExpired, amount);
      }
    }

    const averageApplicationAmount =
      applicationsCount > 0
        ? {
            amount: totalApplied.amount.div(applicationsCount),
            currency: totalApplied.currency,
          }
        : createMoney("0");

    const creditUtilizationRate = totalIssued.amount.greaterThan(0)
      ? totalApplied.amount.div(totalIssued.amount).toNumber() * 100
      : 0;

    return {
      totalIssued,
      totalApplied,
      totalExpired,
      applicationsByType,
      averageApplicationAmount,
      creditUtilizationRate,
    };
  }
}
