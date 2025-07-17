import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return "Freelancer Marketplace Billing API v1.0.0";
  }

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      };
    }
  }
}
