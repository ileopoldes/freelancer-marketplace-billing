import { Module } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { BillingMiddleware } from "../../middleware/billing.middleware";
import { BillingAccessGuard } from "../../guards/billing-access.guard";
import { EntitiesModule } from "../entities/entities.module";

@Module({
  imports: [PrismaModule, EntitiesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, BillingMiddleware, BillingAccessGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
