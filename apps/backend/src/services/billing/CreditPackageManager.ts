import { PrismaClient, Credit, CreditPackage } from "@prisma/client";
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
  maxApplicationPerInvoice?: Money; // Maximum credit that can be applied per invoice
  applicableToTypes?: string[]; // Which invoice line types this applies to
  metadata?: Record<string, unknown>;
}

export interface CreditCondition {
  field: "customer_type" | "invoice_amount" | "credit_age" | "billing_cycle";
  operator: "eq" | "gte" | "lte" | "gt" | "lt" | "in";
  value: string | number | boolean | Date;
}

export interface CreditApplicationResult {
  totalCreditsApplied: Money;
  applications: CreditApplication[];
  remainingInvoiceAmount: Money;
  unusedCredits: string[]; // IDs of credits that couldn't be applied
}

export interface CreditBalance {
  totalAvailable: Money;
  totalApplied: Money;
  breakdown: Array<{
    creditId: string;
    type: CreditType;
    amount: Money;
    remainingAmount: Money;
    appliedAt?: Date;
  }>;
}

export interface EntityCreditBalance {
  entityId: string;
  totalCredits: Money;
  usedCredits: Money;
  availableCredits: Money;
}

export interface CreditPackagePurchase {
  packageId: string;
  entityId: string;
  creditsAmount: Money;
  price: Money;
  purchasedAt: Date;
}

export interface CreditDeductionResult {
  success: boolean;
  deductedAmount: Money;
  remainingBalance: Money;
  reason?: string;
}

/**
 * Simplified credit management without expiration logic
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

    // Promotional credits first
    this.addRule({
      id: "promotional_first",
      name: "Apply Promotional Credits First",
      priority: 0,
    });
  }

  // ===== ENTITY-LEVEL CREDIT PACKAGE MANAGEMENT =====

  /**
   * Purchase a credit package for an entity
   */
  async purchaseCreditPackage(
    entityId: string,
    packageId: string,
    _purchasedBy: string,
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
        },
      });
    } else {
      // Create new balance
      await this.prisma.entityCreditBalance.create({
        data: {
          entityId,
          totalCredits: creditsAmount.amount.toNumber(),
          usedCredits: 0,
        },
      });
    }

    return {
      packageId,
      entityId,
      creditsAmount,
      price,
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
    _reason: string,
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
  async getAvailableCreditPackages(): Promise<CreditPackage[]> {
    return this.prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
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
   * Apply credits to an invoice with simplified logic
   */
  async applyCreditsToInvoice(
    customerId: string,
    invoiceAmount: Money,
    invoiceId?: string,
    lineTypes?: string[],
  ): Promise<CreditApplicationResult> {
    // Get available credits for the customer
    const availableCredits = await this.getAvailableCredits(customerId);

    // Sort credits according to application rules
    const sortedCredits = this.sortCreditsByRules(availableCredits);

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

      const creditAmount = moneyFromDecimalString(credit.amount.toString());
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
      unusedCredits,
    };
  }

  /**
   * Create a new credit for a customer
   */
  async createCredit(params: {
    customerId: string;
    amount: Money;
    type: CreditType;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<Credit> {
    const { customerId, amount, type, description, metadata } = params;

    return this.prisma.credit.create({
      data: {
        customerId,
        amount: moneyToDecimalString(amount),
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
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
    const breakdown: CreditBalance["breakdown"] = [];

    for (const credit of credits) {
      const amount = moneyFromDecimalString(credit.amount.toString());
      const isApplied = credit.appliedAt !== null;

      if (isApplied) {
        totalApplied = addMoney(totalApplied, amount);
      } else {
        totalAvailable = addMoney(totalAvailable, amount);
      }

      breakdown.push({
        creditId: credit.id,
        type: credit.type as CreditType,
        amount,
        remainingAmount: isApplied ? createMoney("0", amount.currency) : amount,
        appliedAt: credit.appliedAt || undefined,
      });
    }

    return {
      totalAvailable,
      totalApplied,
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
  ): Promise<Credit> {
    return this.createCredit({
      customerId,
      amount: refundAmount,
      type: CreditType.REFUND,
      description: `Refund for invoice: ${reason}`,
      metadata: {
        originalInvoiceId,
        refundReason: reason,
        issuedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Issue a promotional credit
   */
  async issuePromotionalCredit(
    customerId: string,
    creditAmount: Money,
    promotionName: string,
  ): Promise<Credit> {
    return this.createCredit({
      customerId,
      amount: creditAmount,
      type: CreditType.PROMOTIONAL,
      description: `Promotional credit: ${promotionName}`,
      metadata: {
        promotionName,
        issuedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Transfer credits between customers
   */
  async transferCredit(
    fromCustomerId: string,
    toCustomerId: string,
    amount: Money,
    reason: string,
  ): Promise<{ debitCredit: Credit; creditCredit: Credit }> {
    // Create negative credit for source customer
    const debitCredit = await this.createCredit({
      customerId: fromCustomerId,
      amount: createMoney(amount.amount.negated().toString(), amount.currency),
      type: CreditType.ADJUSTMENT,
      description: `Credit transfer to customer: ${reason}`,
      metadata: {
        transferTo: toCustomerId,
        transferReason: reason,
      },
    });

    // Create positive credit for destination customer
    const creditCredit = await this.createCredit({
      customerId: toCustomerId,
      amount,
      type: CreditType.ADJUSTMENT,
      description: `Credit transfer from customer: ${reason}`,
      metadata: {
        transferFrom: fromCustomerId,
        transferReason: reason,
      },
    });

    return { debitCredit, creditCredit };
  }

  /**
   * Get available credits for a customer
   */
  private async getAvailableCredits(customerId: string): Promise<Credit[]> {
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
   * Sort credits according to application rules
   */
  private sortCreditsByRules(credits: Credit[]): Credit[] {
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

      // Sort by creation date (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Check if a credit can be applied based on rules
   */
  private canApplyCredit(
    _credit: Credit,
    _invoiceAmount: Money,
    _lineTypes?: string[],
  ): boolean {
    // Simplified rule: allow all credits to be applied
    return true;
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
      // For partial application, create a new credit for the remaining amount
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
  ): Promise<Credit[]> {
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

    const reversedCredits: Credit[] = [];

    for (const credit of appliedCredits) {
      // Create a new credit to reverse the application
      const reversalCredit = await this.createCredit({
        customerId: credit.customerId,
        amount: moneyFromDecimalString(credit.amount.toString()),
        type: CreditType.ADJUSTMENT,
        description: `Reversal of credit application: ${reason}`,
        metadata: {
          originalCreditId: credit.id,
          reversalReason: reason,
          reversedInvoiceId: invoiceId,
          reversedAt: new Date().toISOString(),
        },
      });

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
      applicationsByType,
      averageApplicationAmount,
      creditUtilizationRate,
    };
  }
}
