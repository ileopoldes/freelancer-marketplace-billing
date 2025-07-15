/* eslint-disable no-console */
import { PrismaClient, BillingJob } from "@prisma/client";
import { JobStatus } from "@marketplace/shared";

export interface BillingJobResult {
  id: string;
  asOfDate: Date;
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date | null;
  errorMessage?: string | null;
  totalCustomers: number;
  processedCustomers: number;
  invoicesCreated: number;
}
/**
 * Service for managing billing jobs with idempotency guarantees
 */
export class BillingJobService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new billing job or return existing one (idempotency)
   *
   * @param asOfDate Date to run billing for
   * @param forceRetry Whether to allow retry of failed jobs
   * @returns Billing job record
   */
  async createOrGetJob(
    asOfDate: Date,
    forceRetry = false,
  ): Promise<BillingJobResult> {
    console.log(`🔧 [BILLING-JOB-SERVICE] createOrGetJob called:`);
    console.log(`   - AsOf Date: ${asOfDate.toISOString()}`);
    console.log(`   - Force Retry: ${forceRetry}`);

    // Check for existing job
    console.log(`🔍 [BILLING-JOB-SERVICE] Checking for existing job...`);
    const existingJob = await this.prisma.billingJob.findFirst({
      where: { asOfDate },
    });

    if (existingJob) {
      console.log(`⚠️ [BILLING-JOB-SERVICE] Found existing job:`);
      console.log(`   - ID: ${existingJob.id}`);
      console.log(`   - Status: ${existingJob.status}`);
      console.log(`   - Started: ${existingJob.startedAt.toISOString()}`);
      console.log(`   - Error: ${existingJob.errorMessage || "None"}`);

      // If job is completed, return it (idempotency)
      if (existingJob.status === JobStatus.COMPLETED) {
        console.log(`✅ [BILLING-JOB-SERVICE] Returning completed job`);
        return existingJob as BillingJobResult;
      }

      // If job is running, prevent concurrent execution
      if (
        existingJob.status === JobStatus.RUNNING ||
        existingJob.status === JobStatus.PENDING
      ) {
        console.log(
          `❌ [BILLING-JOB-SERVICE] Job already running/pending - throwing error`,
        );
        throw new Error(
          `Billing job already running for date ${asOfDate.toISOString()}`,
        );
      }

      // If job failed and retry not requested, throw error
      if (existingJob.status === JobStatus.FAILED && !forceRetry) {
        console.log(
          `❌ [BILLING-JOB-SERVICE] Job failed and no retry requested - throwing error`,
        );
        throw new Error(
          `Billing job failed for date ${asOfDate.toISOString()}. ` +
            `Error: ${existingJob.errorMessage}. Use forceRetry=true to retry.`,
        );
      }

      console.log(
        `🔄 [BILLING-JOB-SERVICE] Existing job can be retried or recreated`,
      );
    } else {
      console.log(`✅ [BILLING-JOB-SERVICE] No existing job found`);
    }

    // Create new job
    console.log(`💾 [BILLING-JOB-SERVICE] Creating new billing job...`);
    const newJob = await this.prisma.billingJob.create({
      data: {
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
        totalCustomers: 0,
        processedCustomers: 0,
        invoicesCreated: 0,
      },
    });

    console.log(`🎉 [BILLING-JOB-SERVICE] New job created successfully:`);
    console.log(`   - ID: ${newJob.id}`);
    console.log(`   - Status: ${newJob.status}`);
    console.log(`   - AsOf: ${newJob.asOfDate.toISOString()}`);

    return newJob as BillingJobResult;
  }

  /**
   * Update job status to running
   */
  async markJobAsRunning(asOfDate: Date): Promise<void> {
    await this.prisma.billingJob.update({
      where: { asOfDate },
      data: {
        status: JobStatus.RUNNING,
      },
    });
  }

  /**
   * Update job progress during execution
   */
  async updateJobProgress(
    asOfDate: Date,
    totalCustomers: number,
    processedCustomers: number,
    invoicesCreated: number,
  ): Promise<void> {
    await this.prisma.billingJob.update({
      where: { asOfDate },
      data: {
        totalCustomers,
        processedCustomers,
        invoicesCreated,
      },
    });
  }

  /**
   * Mark job as completed successfully
   */
  async markJobAsCompleted(
    asOfDate: Date,
    totalCustomers: number,
    processedCustomers: number,
    invoicesCreated: number,
  ): Promise<void> {
    await this.prisma.billingJob.update({
      where: { asOfDate },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        totalCustomers,
        processedCustomers,
        invoicesCreated,
      },
    });
  }

  /**
   * Mark job as failed with error message
   */
  async markJobAsFailed(asOfDate: Date, errorMessage: string): Promise<void> {
    await this.prisma.billingJob.update({
      where: { asOfDate },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });
  }

  /**
   * Get job status by date
   */
  async getJobStatusByDate(asOfDate: Date): Promise<BillingJobResult | null> {
    const job = await this.prisma.billingJob.findFirst({
      where: { asOfDate },
    });

    return job as BillingJobResult | null;
  }

  /**
   * Get recent billing jobs
   */
  async getRecentJobs(limit: number = 10): Promise<BillingJobResult[]> {
    const jobs = await this.prisma.billingJob.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return jobs as BillingJobResult[];
  }

  /**
   * Mark a billing job as failed
   */
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    try {
      console.log(`💥 [BILLING-JOB-SERVICE] Marking job as failed:`);
      console.log(`   - Job ID: ${jobId}`);
      console.log(`   - Error Message: ${errorMessage}`);

      const result = await this.prisma.billingJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          errorMessage,
          completedAt: new Date(),
        },
      });

      console.log(`✅ [BILLING-JOB-SERVICE] Job marked as failed:`);
      console.log(`   - Final Status: ${result.status}`);
    } catch (error) {
      console.error(`💥 [BILLING-JOB-SERVICE] Failed to mark job as failed:`);
      console.error(`   - Job ID: ${jobId}`);
      console.error(`   - Original Error: ${errorMessage}`);
      console.error(`   - Update Error:`, error);
      if (error instanceof Error) {
        console.error(`   - Update Error Message: ${error.message}`);
        console.error(`   - Update Error Stack: ${error.stack}`);
      }
      // Still throw to prevent silent failures
      throw error;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: string,
    data: Partial<
      Pick<
        BillingJob,
        | "totalCustomers"
        | "processedCustomers"
        | "invoicesCreated"
        | "errorMessage"
        | "completedAt"
        | "metadata"
      >
    > = {},
  ): Promise<void> {
    try {
      console.log(`📝 [BILLING-JOB-SERVICE] Updating job status:`);
      console.log(`   - Job ID: ${jobId}`);
      console.log(`   - New Status: ${status}`);
      console.log(`   - Additional Data:`, data);

      const result = await this.prisma.billingJob.update({
        where: { id: jobId },
        data: {
          status: status as JobStatus,
          ...data,
        },
      });

      console.log(`✅ [BILLING-JOB-SERVICE] Job status updated successfully`);
      console.log(`   - Updated Status: ${result.status}`);
    } catch (error) {
      console.error(`💥 [BILLING-JOB-SERVICE] Failed to update job status:`);
      console.error(`   - Job ID: ${jobId}`);
      console.error(`   - Attempted Status: ${status}`);
      console.error(`   - Error:`, error);
      if (error instanceof Error) {
        console.error(`   - Error Message: ${error.message}`);
        console.error(`   - Error Stack: ${error.stack}`);
      }
      throw error; // Re-throw to prevent silent failures
    }
  }

  /**
   * Complete a billing job
   */
  async completeJob(
    jobId: string,
    data: {
      processedContracts?: number;
      invoicesGenerated?: number;
      totalBilled?: { amount: { toString(): string } };
      errors?: string[];
    },
  ): Promise<void> {
    try {
      console.log(`🏁 [BILLING-JOB-SERVICE] Completing job:`);
      console.log(`   - Job ID: ${jobId}`);
      console.log(`   - Completion Data:`, data);

      // Only include valid database fields
      const updateData: Partial<
        Pick<
          BillingJob,
          | "status"
          | "completedAt"
          | "processedCustomers"
          | "invoicesCreated"
          | "metadata"
        >
      > = {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        processedCustomers: data.processedContracts || 0,
        invoicesCreated: data.invoicesGenerated || 0,
      };

      // Store additional data in metadata if needed
      if (data.totalBilled || data.errors) {
        updateData.metadata = {
          totalBilled: data.totalBilled
            ? data.totalBilled.amount.toString()
            : undefined,
          errors: data.errors || [],
        };
      }

      const result = await this.prisma.billingJob.update({
        where: { id: jobId },
        data: updateData,
      });

      console.log(`✅ [BILLING-JOB-SERVICE] Job completed successfully:`);
      console.log(`   - Final Status: ${result.status}`);
      console.log(`   - Processed: ${result.processedCustomers}`);
      console.log(`   - Invoices: ${result.invoicesCreated}`);
    } catch (error) {
      console.error(`💥 [BILLING-JOB-SERVICE] Failed to complete job:`);
      console.error(`   - Job ID: ${jobId}`);
      console.error(`   - Error:`, error);
      if (error instanceof Error) {
        console.error(`   - Error Message: ${error.message}`);
        console.error(`   - Error Stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<BillingJobResult | null> {
    const job = await this.prisma.billingJob.findFirst({
      where: { id: jobId },
    });

    return job as BillingJobResult | null;
  }

  /**
   * Start a new billing job (alias for createOrGetJob)
   */
  async startBillingJob(
    asOfDate: Date,
    trigger: "automatic" | "manual",
    customerId?: string,
  ): Promise<BillingJobResult> {
    console.log(`🔧 [BILLING-JOB-SERVICE] startBillingJob called:`);
    console.log(`   - AsOf Date: ${asOfDate.toISOString()}`);
    console.log(`   - Trigger: ${trigger}`);
    console.log(`   - Customer ID: ${customerId || "ALL"}`);

    // Check for existing job
    const existingJob = await this.prisma.billingJob.findFirst({
      where: { asOfDate },
    });

    if (existingJob) {
      console.log(`⚠️ [BILLING-JOB-SERVICE] Found existing job:`);
      console.log(`   - ID: ${existingJob.id}`);
      console.log(`   - Status: ${existingJob.status}`);

      // If job is completed, return it (idempotency)
      if (existingJob.status === JobStatus.COMPLETED) {
        console.log(`✅ [BILLING-JOB-SERVICE] Returning completed job`);
        return existingJob as BillingJobResult;
      }

      // If job is running or pending, return it (don't throw error)
      if (
        existingJob.status === JobStatus.RUNNING ||
        existingJob.status === JobStatus.PENDING
      ) {
        console.log(
          `🔄 [BILLING-JOB-SERVICE] Job already running/pending - returning existing job`,
        );
        return existingJob as BillingJobResult;
      }

      // If job failed, delete it to allow retry
      if (existingJob.status === JobStatus.FAILED) {
        console.log(
          `🗑️ [BILLING-JOB-SERVICE] Deleting failed job to allow retry`,
        );
        await this.prisma.billingJob.delete({
          where: { id: existingJob.id },
        });
        console.log(`✅ [BILLING-JOB-SERVICE] Failed job deleted`);
      }
    } else {
      console.log(`✅ [BILLING-JOB-SERVICE] No existing job found`);
    }

    // Create new billing job
    console.log(`💾 [BILLING-JOB-SERVICE] Creating new billing job...`);
    const newJob = await this.prisma.billingJob.create({
      data: {
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
        totalCustomers: 0,
        processedCustomers: 0,
        invoicesCreated: 0,
        metadata: {
          trigger,
          customerId,
        },
      },
    });

    console.log(`🎉 [BILLING-JOB-SERVICE] New job created successfully:`);
    console.log(`   - ID: ${newJob.id}`);
    console.log(`   - Status: ${newJob.status}`);
    console.log(`   - AsOf: ${newJob.asOfDate.toISOString()}`);

    return newJob as BillingJobResult;
  }

  /**
   * Cancel a running job (if possible)
   */
  async cancelJob(asOfDate: Date): Promise<void> {
    const job = await this.prisma.billingJob.findFirst({
      where: { asOfDate },
    });

    if (!job) {
      throw new Error(`No job found for date ${asOfDate.toISOString()}`);
    }

    if (job.status !== JobStatus.RUNNING && job.status !== JobStatus.PENDING) {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }

    await this.prisma.billingJob.update({
      where: { asOfDate },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
        errorMessage: "Job cancelled by user",
      },
    });
  }
}
