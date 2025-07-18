import { Module } from "@nestjs/common";
import { CreditsController } from "./credits.controller";
import { CreditsService } from "./credits.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { CreditPackageManager } from "../../services/billing/CreditPackageManager";

@Module({
  imports: [PrismaModule],
  controllers: [CreditsController],
  providers: [CreditsService, CreditPackageManager],
  exports: [CreditsService],
})
export class CreditsModule {}
