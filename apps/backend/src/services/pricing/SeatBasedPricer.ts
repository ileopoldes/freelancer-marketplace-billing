import { Money, createMoney, multiplyMoney } from "@marketplace/shared";
import { PrismaClient } from "@prisma/client";

export interface SeatSubscription {
  entityId: string;
  subscriptionType: "MONTHLY" | "ANNUAL";
  seatCount: number;
  pricePerSeat: Money;
  totalPrice: Money;
  nextBillingDate: Date;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
}

export interface SeatChange {
  previousSeatCount: number;
  newSeatCount: number;
  effectiveDate: Date;
  nextBillingDate: Date;
}

/**
 * Simplified service for calculating seat-based subscription pricing
 * Supports monthly/annual billing without proration logic
 */
export class SeatBasedPricer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new seat-based subscription for an entity
   */
  async createSubscription(
    entityId: string,
    subscriptionType: "MONTHLY" | "ANNUAL",
    seatCount: number,
    pricePerSeat: Money,
  ): Promise<SeatSubscription> {
    const totalPrice = multiplyMoney(pricePerSeat, seatCount);
    const nextBillingDate = this.calculateNextBillingDate(subscriptionType);

    await this.prisma.entitySubscription.create({
      data: {
        entityId,
        subscriptionType,
        seatCount,
        monthlyPrice:
          subscriptionType === "MONTHLY" ? totalPrice.amount.toNumber() : 0,
        annualPrice:
          subscriptionType === "ANNUAL" ? totalPrice.amount.toNumber() : 0,
        billingCycle: subscriptionType,
        status: "ACTIVE",
        nextBillingDate,
      },
    });

    return {
      entityId,
      subscriptionType,
      seatCount,
      pricePerSeat,
      totalPrice,
      nextBillingDate,
      status: "ACTIVE",
    };
  }

  /**
   * Update seat count for an entity subscription
   * Changes take effect on the next billing cycle
   */
  async updateSeatCount(
    entityId: string,
    newSeatCount: number,
    effectiveDate: Date = new Date(),
  ): Promise<SeatChange> {
    const subscription = await this.prisma.entitySubscription.findFirst({
      where: { entityId, status: "ACTIVE" },
    });

    if (!subscription) {
      throw new Error(`No active subscription found for entity ${entityId}`);
    }

    const previousSeatCount = subscription.seatCount;
    const pricePerSeat = createMoney("50.00"); // This should come from pricing configuration

    // Update subscription - changes take effect on next billing cycle
    await this.prisma.entitySubscription.update({
      where: { id: subscription.id },
      data: {
        seatCount: newSeatCount,
        monthlyPrice:
          subscription.billingCycle === "MONTHLY"
            ? multiplyMoney(pricePerSeat, newSeatCount).amount.toNumber()
            : subscription.monthlyPrice,
        annualPrice:
          subscription.billingCycle === "ANNUAL"
            ? multiplyMoney(pricePerSeat, newSeatCount).amount.toNumber() * 12
            : subscription.annualPrice,
      },
    });

    return {
      previousSeatCount,
      newSeatCount,
      effectiveDate,
      nextBillingDate: subscription.nextBillingDate!,
    };
  }

  /**
   * Get current subscription for an entity
   */
  async getEntitySubscription(
    entityId: string,
  ): Promise<SeatSubscription | null> {
    const subscription = await this.prisma.entitySubscription.findFirst({
      where: { entityId, status: "ACTIVE" },
    });

    if (!subscription) {
      return null;
    }

    const pricePerSeat = createMoney("50.00"); // This should come from pricing configuration
    const totalPrice = multiplyMoney(pricePerSeat, subscription.seatCount);

    return {
      entityId,
      subscriptionType: subscription.billingCycle as "MONTHLY" | "ANNUAL",
      seatCount: subscription.seatCount,
      pricePerSeat,
      totalPrice,
      nextBillingDate: subscription.nextBillingDate!,
      status: subscription.status as "ACTIVE" | "PAUSED" | "CANCELED",
    };
  }

  /**
   * Get recommended seat count based on active entity users
   */
  async getRecommendedSeatCount(entityId: string): Promise<number> {
    const activeUsers = await this.prisma.entityUser.count({
      where: {
        entityId,
        status: "ACTIVE",
      },
    });

    return activeUsers;
  }

  /**
   * Calculate seat utilization for an entity
   */
  async calculateSeatUtilization(entityId: string): Promise<{
    allocatedSeats: number;
    activeUsers: number;
    utilizationPercentage: number;
    overAllocated: boolean;
  }> {
    const subscription = await this.getEntitySubscription(entityId);
    const activeUsers = await this.getRecommendedSeatCount(entityId);

    const allocatedSeats = subscription?.seatCount || 0;
    const utilizationPercentage =
      allocatedSeats > 0 ? (activeUsers / allocatedSeats) * 100 : 0;
    const overAllocated = activeUsers > allocatedSeats;

    return {
      allocatedSeats,
      activeUsers,
      utilizationPercentage,
      overAllocated,
    };
  }

  private calculateNextBillingDate(
    subscriptionType: "MONTHLY" | "ANNUAL",
  ): Date {
    const now = new Date();
    const nextBilling = new Date(now);

    if (subscriptionType === "MONTHLY") {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    return nextBilling;
  }
}
