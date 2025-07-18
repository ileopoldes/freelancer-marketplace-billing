import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../common/enums/user-roles.enum";

export interface BillingContext {
  entityId: string;
  userId?: string;
  requiresCredits?: boolean;
  minCreditsRequired?: number;
  adminOnly?: boolean;
}

@Injectable()
export class BillingMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async checkBillingAccess(
    context: BillingContext,
  ): Promise<{ canProceed: boolean; reason?: string }> {
    const {
      entityId,
      userId,
      requiresCredits = false,
      minCreditsRequired = 0,
      adminOnly = false,
    } = context;

    // Check if entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        creditBalances: true,
        entityUsers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entity) {
      return { canProceed: false, reason: "Entity not found" };
    }

    // Check credit balance if required
    if (requiresCredits) {
      const creditBalance = entity.creditBalances[0];
      if (!creditBalance) {
        return {
          canProceed: false,
          reason: "No credit balance found for entity",
        };
      }

      const availableCredits =
        creditBalance.totalCredits.toNumber() -
        creditBalance.usedCredits.toNumber();
      if (availableCredits < minCreditsRequired) {
        return {
          canProceed: false,
          reason: `Insufficient credits. Required: ${minCreditsRequired}, Available: ${availableCredits}`,
        };
      }
    }

    // Check admin-only access
    if (adminOnly && userId) {
      const entityUser = entity.entityUsers.find((eu) => eu.userId === userId);
      if (!entityUser) {
        return { canProceed: false, reason: "User not associated with entity" };
      }

      const userRole = entityUser.user.globalRole;
      if (
        userRole !== UserRole.ADMIN &&
        entityUser.role !== UserRole.ADMIN &&
        entityUser.role !== UserRole.ENTITY_ADMIN
      ) {
        return {
          canProceed: false,
          reason: "Administrative privileges required",
        };
      }
    }

    return { canProceed: true };
  }

  async validateCreditPurchase(
    entityId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.checkBillingAccess({
      entityId,
      userId,
      adminOnly: true,
    });

    if (!result.canProceed) {
      throw new ForbiddenException(
        result.reason || "Credit purchase not authorized",
      );
    }
  }

  async validateCreditDeduction(
    entityId: string,
    requiredAmount: number,
  ): Promise<void> {
    const result = await this.checkBillingAccess({
      entityId,
      requiresCredits: true,
      minCreditsRequired: requiredAmount,
    });

    if (!result.canProceed) {
      throw new ForbiddenException(
        result.reason || "Insufficient credits for operation",
      );
    }
  }

  async validateFeatureAccess(
    entityId: string,
    featureName: string,
  ): Promise<void> {
    // Check if the entity has access to specific features based on billing status
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        creditBalances: true,
        subscriptions: true,
      },
    });

    if (!entity) {
      throw new BadRequestException("Entity not found");
    }

    // Define feature access rules based on billing status
    const featureRules = this.getFeatureAccessRules();
    const rule = featureRules[featureName];

    if (!rule) {
      // Feature has no billing restrictions
      return;
    }

    if (rule.requiresCredits) {
      const creditBalance = entity.creditBalances[0];
      if (!creditBalance) {
        throw new ForbiddenException(
          `Feature '${featureName}' requires active credit balance`,
        );
      }

      const availableCredits =
        creditBalance.totalCredits.toNumber() -
        creditBalance.usedCredits.toNumber();
      if (availableCredits < rule.minCreditsRequired) {
        throw new ForbiddenException(
          `Feature '${featureName}' requires at least ${rule.minCreditsRequired} credits`,
        );
      }
    }

    if (rule.requiresActiveSubscription) {
      const activeSubscription = entity.subscriptions.find(
        (sub) => sub.status === "ACTIVE",
      );
      if (!activeSubscription) {
        throw new ForbiddenException(
          `Feature '${featureName}' requires an active subscription`,
        );
      }
    }
  }

  private getFeatureAccessRules(): Record<
    string,
    {
      requiresCredits?: boolean;
      minCreditsRequired?: number;
      requiresActiveSubscription?: boolean;
    }
  > {
    return {
      project_creation: {
        requiresCredits: true,
        minCreditsRequired: 1,
      },
      project_assignment: {
        requiresCredits: true,
        minCreditsRequired: 5,
      },
      marketplace_events: {
        requiresCredits: true,
        minCreditsRequired: 1,
      },
      billing_reports: {
        requiresActiveSubscription: true,
      },
      advanced_analytics: {
        requiresActiveSubscription: true,
      },
    };
  }
}
