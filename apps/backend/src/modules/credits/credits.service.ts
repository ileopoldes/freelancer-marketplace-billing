import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreditPackageManager } from "../../services/billing/CreditPackageManager";
import { PurchaseCreditsDto } from "./dto/purchase-credits.dto";

@Injectable()
export class CreditsService {
  constructor(
    private prisma: PrismaService,
    private creditPackageManager: CreditPackageManager,
  ) {}

  async purchaseCredits(purchaseCreditsDto: PurchaseCreditsDto) {
    const { entityId, packageId, purchasedByUserId } = purchaseCreditsDto;

    // Verify entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${entityId} not found`);
    }

    // Use the existing credit package manager
    const result = await this.creditPackageManager.purchaseCreditPackage(
      entityId,
      packageId,
      purchasedByUserId,
    );

    return {
      success: true,
      message: "Credits purchased successfully",
      data: result,
    };
  }

  async getBalance(entityId: string) {
    const balance =
      await this.creditPackageManager.getEntityCreditBalance(entityId);

    if (!balance) {
      return {
        entityId,
        balance: 0,
        availableCredits: 0,
      };
    }

    return {
      entityId,
      balance: balance.totalCredits,
      availableCredits: balance.availableCredits,
    };
  }

  async getHistory(entityId: string, limit = 50, offset = 0) {
    // Use marketplace events as credit transaction history
    const history = await this.prisma.marketplaceEvent.findMany({
      where: { entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await this.prisma.marketplaceEvent.count({
      where: { entityId },
    });

    return {
      data: history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getAvailablePackages() {
    const packages =
      await this.creditPackageManager.getAvailableCreditPackages();

    return {
      data: packages,
    };
  }

  async addCredits(
    entityId: string,
    amount: number,
    description: string,
    type = "MANUAL",
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    // Verify entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${entityId} not found`);
    }

    // Get existing balance or create new one
    const existingBalance = await this.prisma.entityCreditBalance.findFirst({
      where: { entityId },
    });

    if (existingBalance) {
      // Add to existing balance
      await this.prisma.entityCreditBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalCredits: {
            increment: amount,
          },
        },
      });
    } else {
      // Create new balance
      await this.prisma.entityCreditBalance.create({
        data: {
          entityId,
          totalCredits: amount,
          usedCredits: 0,
        },
      });
    }

    // Create a transaction record in marketplace events for audit trail
    await this.prisma.marketplaceEvent.create({
      data: {
        eventType: "CREDIT_ADDED",
        entityId: entityId,
        userId: "system", // This would ideally be the admin user ID
        quantity: 1,
        unitPrice: amount,
        description: `${type}: ${description}`,
        metadata: { type, description },
      },
    });

    // Get updated balance
    const updatedBalance =
      await this.creditPackageManager.getEntityCreditBalance(entityId);

    return {
      success: true,
      message: "Credits added successfully",
      data: updatedBalance,
    };
  }

  async deductCredits(
    entityId: string,
    amount: number,
    userId: string,
    reason: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    const { createMoney } = await import("@marketplace/shared");
    const creditAmount = createMoney(amount.toString());

    const result = await this.creditPackageManager.deductCreditsForEvent(
      entityId,
      userId,
      "manual_deduction",
      creditAmount,
      reason,
    );

    if (!result.success) {
      throw new BadRequestException(result.reason);
    }

    return {
      success: true,
      message: "Credits deducted successfully",
      data: result,
    };
  }
}
