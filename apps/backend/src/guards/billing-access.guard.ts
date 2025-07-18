import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { BillingMiddleware } from "../middleware/billing.middleware";
import {
  BILLING_ACCESS_KEY,
  BillingAccessOptions,
} from "../decorators/billing-access.decorator";

@Injectable()
export class BillingAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingMiddleware: BillingMiddleware,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const billingOptions = this.reflector.get<BillingAccessOptions>(
      BILLING_ACCESS_KEY,
      context.getHandler(),
    );

    if (!billingOptions) {
      // No billing restrictions, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const entityId = this.extractEntityId(request);
    const userId = this.extractUserId(request);

    if (!entityId) {
      // If no entity ID available, skip billing validation
      return true;
    }

    if (billingOptions.featureName) {
      await this.billingMiddleware.validateFeatureAccess(
        entityId,
        billingOptions.featureName,
      );
    }

    if (billingOptions.adminOnly) {
      await this.billingMiddleware.validateCreditPurchase(entityId, userId);
    }

    if (billingOptions.requiresCredits) {
      await this.billingMiddleware.validateCreditDeduction(
        entityId,
        billingOptions.minCreditsRequired || 0,
      );
    }

    return true;
  }

  private extractEntityId(request: any): string | null {
    // Try to extract entity ID from various sources
    return (
      request.params?.entityId ||
      request.body?.entityId ||
      request.query?.entityId ||
      request.headers?.["x-entity-id"] ||
      null
    );
  }

  private extractUserId(request: any): string | null {
    // Try to extract user ID from various sources
    return (
      request.user?.id ||
      request.params?.userId ||
      request.body?.userId ||
      request.headers?.["x-user-id"] ||
      null
    );
  }
}
