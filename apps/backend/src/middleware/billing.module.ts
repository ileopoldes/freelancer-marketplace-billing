import { Module } from "@nestjs/common";
import { BillingMiddleware } from "./billing.middleware";
import { BillingAccessGuard } from "../guards/billing-access.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [BillingMiddleware, BillingAccessGuard],
  exports: [BillingMiddleware, BillingAccessGuard],
})
export class BillingModule {}
