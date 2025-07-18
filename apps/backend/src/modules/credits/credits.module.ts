import { Module } from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { CreditsController } from "./credits.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { CreditPackageManager } from "../../services/billing/CreditPackageManager";
import { BillingMiddleware } from "../../middleware/billing.middleware";
import { BillingAccessGuard } from "../../guards/billing-access.guard";

@Module({
  imports: [PrismaModule],
  controllers: [CreditsController],
  providers: [
    CreditsService,
    CreditPackageManager,
    BillingMiddleware,
    BillingAccessGuard,
  ],
  exports: [CreditsService, BillingMiddleware],
})
export class CreditsModule {}
