import { PrismaClient } from "@prisma/client";
import { Logger } from "@nestjs/common";
import { BillingJobService } from "./BillingJobService";
import { InvoiceGenerator, ContractWithCustomer } from "./InvoiceGenerator";
import { CreditPackageManager } from "./CreditPackageManager";
import { MarketplaceEventProcessor } from "./MarketplaceEventProcessor";
import { PayAsYouGoPricer } from "../pricing/PayAsYouGoPricer";
import { SeatBasedPricer } from "../pricing/SeatBasedPricer";
import {
  Money,
  createMoney,
  addMoney,
  moneyFromDecimalString,
  ContractStatus,
  JobStatus,
} from "@marketplace/shared";

export interface BillingRunResult {
  jobId: string;
  totalContracts: number;
  processedContracts: number;
  invoicesGenerated: number;
  totalBilled: Money;
  skippedContracts: number;
  errors: string[];
}

export interface ContractUsage {
  contractId: string;
  totalUsage: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Main billing engine that orchestrates the complete billing process
 */
export class MarketplaceBillingEngine {
  private readonly logger = new Logger(MarketplaceBillingEngine.name);
  private jobService: BillingJobService;
  private invoiceGenerator: InvoiceGenerator;
  private creditPackageManager: CreditPackageManager;
  private marketplaceEventProcessor: MarketplaceEventProcessor;
  private payAsYouGoPricer: PayAsYouGoPricer;
  private seatBasedPricer: SeatBasedPricer;

  constructor(private prisma: PrismaClient) {
    this.jobService = new BillingJobService(prisma);
    this.invoiceGenerator = new InvoiceGenerator(prisma);
    this.creditPackageManager = new CreditPackageManager(prisma);
    this.marketplaceEventProcessor = new MarketplaceEventProcessor(prisma);
    this.payAsYouGoPricer = new PayAsYouGoPricer(prisma);
    this.seatBasedPricer = new SeatBasedPricer(prisma);
  }

  /**
   * Execute a complete billing run
   */
  async executeBillingRun(
    effectiveDate: Date = new Date(),
  ): Promise<BillingRunResult> {
    // 1. Start billing job
    const job = await this.jobService.startBillingJob(
      effectiveDate,
      "automatic",
    );

    try {
      // 2. Find contracts due for billing
      const contractsDue = await this.findContractsDueForBilling(effectiveDate);

      await this.jobService.updateJobStatus(job.id, "RUNNING", {
        totalCustomers: contractsDue.length,
      });

      // 3. Process each contract
      const results = {
        jobId: job.id,
        totalContracts: contractsDue.length,
        processedContracts: 0,
        invoicesGenerated: 0,
        totalBilled: createMoney("0"),
        skippedContracts: 0,
        errors: [] as string[],
      };

      for (const contract of contractsDue) {
        try {
          // Calculate billing period
          const billingPeriod = this.calculateBillingPeriod(
            contract,
            effectiveDate,
          );

          // Aggregate usage for the period
          const usage = await this.aggregateUsage(
            contract.id,
            billingPeriod.start,
            billingPeriod.end,
          );

          // Generate invoice
          const invoice = await this.invoiceGenerator.generateInvoice(
            contract,
            usage.totalUsage,
            billingPeriod.start,
            billingPeriod.end,
            contract.billingCycle || 1,
          );

          // Update results
          results.processedContracts++;
          results.invoicesGenerated++;
          results.totalBilled = addMoney(
            results.totalBilled,
            moneyFromDecimalString(invoice.total.toString()),
          );

          // Update next billing date
          await this.updateNextBillingDate(contract.id, effectiveDate);
        } catch (error) {
          results.errors.push(
            `Contract ${contract.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          results.skippedContracts++;
        }
      }

      // 4. Complete the job
      await this.jobService.completeJob(job.id, {
        processedContracts: results.processedContracts,
        invoicesGenerated: results.invoicesGenerated,
        totalBilled: results.totalBilled,
        errors: results.errors,
      });

      return results;
    } catch (error) {
      // Mark job as failed
      await this.jobService.failJob(
        job.id,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  /**
   * Find contracts that are due for billing
   */
  async findContractsDueForBilling(
    effectiveDate: Date,
  ): Promise<ContractWithCustomer[]> {
    const contracts = await this.prisma.contract.findMany({
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

    return contracts.map((contract) => ({
      id: contract.id,
      customerId: contract.customerId,
      baseFee: contract.baseFee.toString(),
      minCommitCalls: contract.minCommitCalls,
      callOverageFee: contract.callOverageFee.toString(),
      discountRate: contract.discountRate.toString(),
      billingCycle: contract.billingCycle || 1,
      nextBillingDate: contract.nextBillingDate,
      customer: {
        id: contract.customer.id,
        name: contract.customer.name,
        email: contract.customer.email,
        creditBalance: contract.customer.creditBalance.toString(),
      },
    })) as ContractWithCustomer[];
  }

  /**
   * Aggregate usage for a billing period
   */
  async aggregateUsage(
    contractId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ContractUsage> {
    const usageRecords = await this.prisma.usageEvent.findMany({
      where: {
        contractId,
        timestamp: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    });

    const totalUsage = usageRecords.reduce(
      (sum, record) => sum + record.quantity,
      0,
    );

    return {
      contractId,
      totalUsage,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Calculate billing period for a contract
   */
  private calculateBillingPeriod(
    contract: ContractWithCustomer,
    effectiveDate: Date,
  ): { start: Date; end: Date } {
    // Get the contract's next billing date or use the current date if missing
    let nextBillingDate: Date;

    if (contract.nextBillingDate) {
      nextBillingDate = new Date(contract.nextBillingDate);
    } else {
      // Fallback to effectiveDate if nextBillingDate is missing
      nextBillingDate = new Date(effectiveDate);
    }

    // Validate the date
    if (isNaN(nextBillingDate.getTime())) {
      this.logger.error(`Invalid nextBillingDate for contract ${contract.id}`);
      nextBillingDate = new Date(effectiveDate);
    }

    // Calculate the billing period: from one month before nextBillingDate to nextBillingDate
    const periodEnd = new Date(nextBillingDate);
    const periodStart = new Date(nextBillingDate);

    // Subtract one month properly
    const currentMonth = periodStart.getMonth();
    const currentYear = periodStart.getFullYear();

    if (currentMonth === 0) {
      // January -> December of previous year
      periodStart.setFullYear(currentYear - 1, 11, periodStart.getDate());
    } else {
      // Normal case: subtract one month
      periodStart.setMonth(currentMonth - 1);
    }

    // Handle month-end date adjustments (e.g., Mar 31 -> Feb 28/29)
    if (periodStart.getDate() !== nextBillingDate.getDate()) {
      // The date was adjusted due to shorter month, use last day of that month
      const lastDay = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth() + 1,
        0,
      ).getDate();
      periodStart.setDate(Math.min(nextBillingDate.getDate(), lastDay));
    }

    return {
      start: periodStart,
      end: periodEnd,
    };
  }

  /**
   * Update next billing date for a contract
   */
  private async updateNextBillingDate(
    contractId: string,
    effectiveDate: Date,
  ): Promise<void> {
    // For monthly billing, add one month using proper date arithmetic
    const nextBillingDate = new Date(effectiveDate);

    // Properly handle month boundaries
    const year = nextBillingDate.getFullYear();
    const month = nextBillingDate.getMonth();
    const day = nextBillingDate.getDate();

    if (month === 11) {
      // December -> January of next year
      nextBillingDate.setFullYear(year + 1, 0, day);
    } else {
      // Normal case: add one month
      nextBillingDate.setFullYear(year, month + 1, day);
    }

    // Handle cases where the target day doesn't exist in the next month
    // (e.g., Jan 31 -> Feb 28/29)
    const lastDayOfNextMonth = new Date(
      nextBillingDate.getFullYear(),
      nextBillingDate.getMonth() + 1,
      0,
    ).getDate();
    if (nextBillingDate.getDate() > lastDayOfNextMonth) {
      nextBillingDate.setDate(lastDayOfNextMonth);
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        nextBillingDate,
        lastBilledAt: effectiveDate,
        billingCycle: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Process billing for a specific customer
   */
  async billCustomer(
    customerId: string,
    effectiveDate: Date = new Date(),
  ): Promise<BillingRunResult> {
    const contracts = await this.prisma.contract.findMany({
      where: {
        customerId,
        status: ContractStatus.ACTIVE,
      },
      include: {
        customer: true,
      },
    });

    if (contracts.length === 0) {
      throw new Error(`No active contracts found for customer ${customerId}`);
    }

    // Start job for specific customer
    const job = await this.jobService.startBillingJob(
      effectiveDate,
      "manual",
      customerId,
    );

    try {
      const results = {
        jobId: job.id,
        totalContracts: contracts.length,
        processedContracts: 0,
        invoicesGenerated: 0,
        totalBilled: createMoney("0"),
        skippedContracts: 0,
        errors: [] as string[],
      };

      // Process each contract
      await this.processContractsForCustomer(
        contracts.map((contract) => ({
          ...contract,
          baseFee: parseFloat(contract.baseFee.toString()),
          minCommitCalls: parseInt(contract.minCommitCalls.toString()),
          callOverageFee: parseFloat(contract.callOverageFee.toString()),
          discountRate: parseFloat(contract.discountRate.toString()),
          billingCycle: parseInt(contract.billingCycle.toString()),
          customer: {
            ...contract.customer,
            creditBalance: parseFloat(
              contract.customer.creditBalance.toString(),
            ),
          },
        })),
        effectiveDate,
        results,
      );

      await this.jobService.completeJob(job.id, {
        processedContracts: results.processedContracts,
        invoicesGenerated: results.invoicesGenerated,
        totalBilled: results.totalBilled,
        errors: results.errors,
      });

      return results;
    } catch (error) {
      await this.jobService.failJob(
        job.id,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  /**
   * Process contracts for a specific customer
   */
  private async processContractsForCustomer(
    contracts: Array<{
      id: string;
      customerId: string;
      baseFee: number;
      minCommitCalls: number;
      callOverageFee: number;
      discountRate: number;
      billingCycle: number;
      customer: {
        id: string;
        name: string;
        email: string;
        creditBalance: number;
      };
    }>,
    effectiveDate: Date,
    results: BillingRunResult,
  ): Promise<void> {
    for (const contract of contracts) {
      try {
        const contractData = {
          id: contract.id,
          customerId: contract.customerId,
          baseFee: contract.baseFee.toString(),
          minCommitCalls: contract.minCommitCalls,
          callOverageFee: contract.callOverageFee.toString(),
          discountRate: contract.discountRate.toString(),
          billingCycle: contract.billingCycle || 1,
          customer: {
            id: contract.customer.id,
            name: contract.customer.name,
            email: contract.customer.email,
            creditBalance: contract.customer.creditBalance.toString(),
          },
        };

        const billingPeriod = this.calculateBillingPeriod(
          contractData,
          effectiveDate,
        );

        const usage = await this.aggregateUsage(
          contract.id,
          billingPeriod.start,
          billingPeriod.end,
        );

        const invoice = await this.invoiceGenerator.generateInvoice(
          contractData,
          usage.totalUsage,
          billingPeriod.start,
          billingPeriod.end,
          contract.billingCycle,
        );

        results.processedContracts++;
        results.invoicesGenerated++;
        results.totalBilled = addMoney(
          results.totalBilled,
          moneyFromDecimalString(invoice.total.toString()),
        );
      } catch (error) {
        results.errors.push(
          `Contract ${contract.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        results.skippedContracts++;
      }
    }
  }

  /**
   * Get billing job status
   */
  async getBillingJobStatus(jobId: string) {
    return this.jobService.getJobStatus(jobId);
  }

  /**
   * Get recent billing jobs
   */
  async getRecentBillingJobs(limit: number = 10) {
    return this.jobService.getRecentJobs(limit);
  }

  /**
   * Get contracts due for billing (alias for compatibility)
   */
  async getContractsDueForBilling(effectiveDate: Date) {
    return this.findContractsDueForBilling(effectiveDate);
  }

  /**
   * Filter contracts by their recurrence schedule
   */
  async filterContractsBySchedule(
    contracts: ContractWithCustomer[],
    effectiveDate: Date,
  ): Promise<ContractWithCustomer[]> {
    return contracts.filter((_contract) => {
      // Simplified: default to monthly billing on the 1st
      return effectiveDate.getDate() === 1;
    });
  }

  /**
   * Aggregate usage for a billing period (alias for compatibility)
   */
  async aggregateUsageForPeriod(
    contractId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const usageRecords = await this.prisma.usageEvent.findMany({
      where: {
        contractId,
        timestamp: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    });

    return usageRecords.reduce((sum, record) => sum + record.quantity, 0);
  }

  /**
   * Run a complete billing job (simplified for testing)
   */
  async runBillingJob(asOfDate: Date): Promise<{
    success: boolean;
    invoicesCreated: number;
    totalCustomers: number;
    error?: string;
  }> {
    try {
      const result = await this.executeBillingRun(asOfDate);

      return {
        success: true,
        invoicesCreated: result.invoicesGenerated,
        totalCustomers: result.processedContracts,
      };
    } catch (error) {
      // Update job status to failed
      await this.prisma.billingJob.update({
        where: { asOfDate },
        data: {
          status: JobStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });

      return {
        success: false,
        invoicesCreated: 0,
        totalCustomers: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ===== MARKETPLACE-SPECIFIC BILLING METHODS =====

  /**
   * Get credit package manager instance
   */
  getCreditPackageManager(): CreditPackageManager {
    return this.creditPackageManager;
  }

  /**
   * Get marketplace event processor instance
   */
  getMarketplaceEventProcessor(): MarketplaceEventProcessor {
    return this.marketplaceEventProcessor;
  }

  /**
   * Get pay-as-you-go pricer instance
   */
  getPayAsYouGoPricer(): PayAsYouGoPricer {
    return this.payAsYouGoPricer;
  }

  /**
   * Get seat-based pricer instance
   */
  getSeatBasedPricer(): SeatBasedPricer {
    return this.seatBasedPricer;
  }

  /**
   * Process marketplace event (simplified interface)
   */
  async processMarketplaceEvent(
    entityId: string,
    userId: string,
    eventType: "project_posted" | "freelancer_hired" | "custom",
    quantity: number = 1,
    metadata?: Record<string, unknown>,
  ) {
    return this.marketplaceEventProcessor.processEvent({
      entityId,
      userId,
      eventType,
      quantity,
      metadata,
    });
  }

  /**
   * Get entity billing overview combining all billing models
   */
  async getEntityBillingOverview(entityId: string) {
    const [creditBalance, subscription] = await Promise.all([
      this.creditPackageManager.getEntityCreditBalance(entityId),
      this.seatBasedPricer.getEntitySubscription(entityId),
    ]);

    return {
      entityId,
      creditBalance,
      subscription,
      timestamp: new Date(),
    };
  }

  /**
   * Get billing summary for a date range
   */
  async getEntityBillingSummary(
    entityId: string,
    fromDate: Date,
    toDate: Date,
  ) {
    const [eventSummary, seatUtilization] = await Promise.all([
      this.marketplaceEventProcessor.getBillingSummary(
        entityId,
        fromDate,
        toDate,
      ),
      this.seatBasedPricer.calculateSeatUtilization(entityId),
    ]);

    return {
      entityId,
      period: { fromDate, toDate },
      eventSummary,
      seatUtilization,
      timestamp: new Date(),
    };
  }
}
