import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BillingService } from "./billing.service";

interface CreateBillingJobRequest {
  entityId?: string;
  type: "manual" | "automatic";
  effectiveDate?: string;
}

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("jobs")
  async getBillingJobs() {
    try {
      const jobs = await this.billingService.getBillingJobs();
      return { jobs };
    } catch (error) {
      throw new HttpException(
        "Failed to fetch billing jobs",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("jobs")
  async createBillingJob(@Body() body: CreateBillingJobRequest) {
    try {
      const job = await this.billingService.createBillingJob(body);
      return { job };
    } catch (error) {
      throw new HttpException(
        "Failed to create billing job",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("jobs/:id")
  async getBillingJob(@Param("id") id: string) {
    try {
      const job = await this.billingService.getBillingJob(id);
      if (!job) {
        throw new HttpException("Billing job not found", HttpStatus.NOT_FOUND);
      }
      return job;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch billing job",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
