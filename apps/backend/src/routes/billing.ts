import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { MarketplaceBillingEngine } from "../services/billing/MarketplaceBillingEngine";

export async function billingRoutes(
  server: FastifyInstance,
  options: { prisma: PrismaClient },
) {
  const { prisma } = options;
  const billingEngine = new MarketplaceBillingEngine(prisma);

  // Run billing job
  server.post("/api/billing/run", async (request, reply) => {
    try {
      const query = request.query as { asOf?: string };
      const asOfDate = query.asOf ? new Date(query.asOf) : new Date();

      server.log.info(`🚀 [BILLING-API] Starting billing job request...`);
      server.log.info(`📅 [BILLING-API] Query parameters:`, query);
      server.log.info(
        `📅 [BILLING-API] Parsed asOfDate: ${asOfDate.toISOString()}`,
      );

      // Validate date
      if (Number.isNaN(asOfDate.getTime())) {
        server.log.warn(`❌ [BILLING-API] Invalid date format: ${query.asOf}`);
        reply.status(400);
        return { error: "Invalid asOf date format" };
      }

      // Run actual billing job execution in background
      setTimeout(async () => {
        try {
          server.log.info(
            `⚡ [BILLING-ENGINE] Starting execution for asOfDate: ${asOfDate.toISOString()}`,
          );

          // Run the actual billing engine (which uses centralized job service)
          const result = await billingEngine.runBillingJob(asOfDate);

          server.log.info(
            `✅ [BILLING-ENGINE] Job completed successfully:`,
            result,
          );
        } catch (error) {
          server.log.error(`💥 [BILLING-ENGINE] Job failed with error:`);
          if (error instanceof Error) {
            server.log.error(`   - Error Type: ${error.constructor.name}`);
            server.log.error(`   - Error Message: ${error.message}`);
            server.log.error(`   - Error Stack: ${error.stack}`);
          } else {
            server.log.error(`   - Unknown Error:`, error);
          }
        }
      }, 100); // Start almost immediately

      // Return immediate response (job will be created by billing engine)
      return {
        message: "Billing job started",
        asOfDate: asOfDate.toISOString(),
        status: "PENDING",
      };
    } catch (error) {
      server.log.error("💥 [BILLING-API] Failed to start billing job:", error);

      reply.status(500);
      return { error: "Failed to start billing job" };
    }
  });

  // Get billing jobs
  server.get("/api/billing/jobs", async (request, reply) => {
    try {
      const jobs = await prisma.billingJob.findMany({
        orderBy: { startedAt: "desc" },
        take: 20,
      });

      const formattedJobs = jobs.map((job) => ({
        id: job.id,
        asOfDate: job.asOfDate.toISOString(),
        status: job.status,
        contractsProcessed: job.processedCustomers,
        invoicesGenerated: job.invoicesCreated,
        totalBilled: undefined, // Would calculate from processed invoices
        errorMessage: job.errorMessage,
        createdAt: job.startedAt.toISOString(),
        updatedAt: (job.completedAt || job.startedAt).toISOString(),
      }));

      return { jobs: formattedJobs };
    } catch (error) {
      server.log.error("Failed to fetch billing jobs:", error);
      reply.status(500);
      return { error: "Failed to fetch billing jobs" };
    }
  });

  // Get billing job by ID
  server.get("/api/billing/jobs/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.billingJob.findUnique({
        where: { id },
      });

      if (!job) {
        reply.status(404);
        return { error: "Billing job not found" };
      }

      return {
        id: job.id,
        asOfDate: job.asOfDate.toISOString(),
        status: job.status,
        contractsProcessed: job.processedCustomers,
        invoicesGenerated: job.invoicesCreated,
        totalBilled: undefined,
        errorMessage: job.errorMessage,
        createdAt: job.startedAt.toISOString(),
        updatedAt: (job.completedAt || job.startedAt).toISOString(),
      };
    } catch (error) {
      server.log.error("Failed to fetch billing job:", error);
      reply.status(500);
      return { error: "Failed to fetch billing job" };
    }
  });
}
