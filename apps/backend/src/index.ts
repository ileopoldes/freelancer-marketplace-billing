import fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { customerRoutes } from "./routes/customers.js";
import { invoiceRoutes } from "./routes/invoices.js";
import { billingRoutes } from "./routes/billing.js";

const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

const prisma = new PrismaClient();

// Register plugins
server.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
});

server.register(helmet);

server.register(rateLimit, {
  max: Number.parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  timeWindow: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10), // 15 minutes
});

// Health check endpoint
server.get("/health", async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", timestamp: new Date().toISOString() };
  } catch (error) {
    server.log.error("Health check failed:", error);
    reply.status(503);
    return { status: "error", timestamp: new Date().toISOString() };
  }
});

// API routes
server.get("/api", async () => ({
  message: "Freelancer Marketplace Billing API v1.0.0",
}));

// Register API routes
server.register(customerRoutes, { prisma });
server.register(invoiceRoutes, { prisma });
server.register(billingRoutes, { prisma });

// Graceful shutdown
process.on("SIGINT", async () => {
  server.log.info("Received SIGINT, shutting down gracefully...");
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  server.log.info("Received SIGTERM, shutting down gracefully...");
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

// Start server
const start = async () => {
  try {
    const port = Number.parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    server.log.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    await prisma.$disconnect();
    throw error;
  }
};

start();
