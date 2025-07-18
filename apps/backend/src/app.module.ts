import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_FILTER } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { CustomersModule } from "./customers/customers.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { BillingModule } from "./billing/billing.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// New modules
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { EntitiesModule } from "./modules/entities/entities.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { CreditsModule } from "./modules/credits/credits.module";
// import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
// import { ContractsModule } from "./modules/contracts/contracts.module";
// import { PermissionsModule } from "./modules/permissions/permissions.module";

// Global error handler
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    CustomersModule,
    InvoicesModule,
    BillingModule,
    OrganizationsModule,
    EntitiesModule,
    ProjectsModule,
    CreditsModule,
    // SubscriptionsModule,
    // ContractsModule,
    // PermissionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
