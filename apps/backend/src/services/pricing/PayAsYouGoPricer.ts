import { Money, createMoney, addMoney, multiplyMoney, subtractMoney } from '@marketplace/shared';
import { PrismaClient } from '@prisma/client';

export interface MarketplaceEventTier {
  limit: number | null; // null for unlimited tier
  price: Money; // Price per unit in this tier
}

export interface EventPricingConfig {
  eventType: string;
  basePrice: Money;
  tiers?: MarketplaceEventTier[];
  bulkDiscounts?: BulkDiscount[];
}

export interface BulkDiscount {
  minQuantity: number;
  discountPercentage: number;
}

export interface PayAsYouGoCalculation {
  eventType: string;
  quantity: number;
  baseAmount: Money;
  discountApplied: Money;
  finalAmount: Money;
  tier?: number;
}

/**
 * Service for calculating pay-as-you-go pricing for marketplace events
 * Supports tiered pricing, bulk discounts, and entity-specific rates
 */
export class PayAsYouGoPricer {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  /**
   * Calculate pricing for marketplace events with support for bulk discounts
   */
  async calculateBulkEventPricing(
    entityId: string,
    events: Array<{ eventType: string; quantity: number }>
  ): Promise<PayAsYouGoCalculation[]> {
    const calculations: PayAsYouGoCalculation[] = [];
    
    for (const event of events) {
      const calculation = await this.calculateEventPricing(
        entityId,
        event.eventType,
        event.quantity
      );
      calculations.push(calculation);
    }
    
    return calculations;
  }
  
  /**
   * Get total cost for an entity across all event types
   */
  async getTotalEventCost(
    entityId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Money> {
    const events = await this.prisma.marketplaceEvent.findMany({
      where: {
        entityId,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });
    
    let totalCost = createMoney('0');
    
    // Group events by type and sum quantities
    const eventGroups = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = 0;
      }
      acc[event.eventType] += event.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate cost for each event type
    for (const [eventType, quantity] of Object.entries(eventGroups)) {
      const calculation = await this.calculateEventPricing(entityId, eventType, Number(quantity));
      totalCost = addMoney(totalCost, calculation.finalAmount);
    }
    
    return totalCost;
  }
  
  /**
   * Calculate pricing for a single marketplace event for a given entity
   * Includes tiered pricing and bulk discounts
   */
  async calculateEventPricing(entityId: string, eventType: string, quantity: number): Promise<PayAsYouGoCalculation> {
    const config = await this.getPricingConfig(entityId, eventType);
    const baseAmount = multiplyMoney(config.basePrice, quantity);

    // Apply bulk discounts
    let discountApplied = createMoney('0');
    if (config.bulkDiscounts) {
      for (const discount of config.bulkDiscounts) {
        if (quantity >= discount.minQuantity) {
          const discountValue = baseAmount.amount.times(discount.discountPercentage).div(100);
          discountApplied = createMoney(discountValue.toFixed(2));
        }
      }
    }

    // Calculate final amount
    const finalAmount = subtractMoney(baseAmount, discountApplied);

    // Tier Pricing (if applicable)
    let tier: number | undefined;
    if (config.tiers) {
      tier = this.applyTierPricing(config.tiers, quantity);
    }

    return {
      eventType,
      quantity,
      baseAmount,
      discountApplied,
      finalAmount,
      tier
    };
  }

  private async getPricingConfig(entityId: string, eventType: string): Promise<EventPricingConfig> {
    // Fetch pricing config from database or configuration service
    // Simplified logic for demonstration purposes
    return {
      eventType,
      basePrice: createMoney('10.00'),  // Generic pricing logic
      bulkDiscounts: [{ minQuantity: 100, discountPercentage: 10 }],
      tiers: [{ limit: 100, price: createMoney('9.00') }, { limit: 500, price: createMoney('8.50') }, { limit: null, price: createMoney('8.00') }]
    };
  }

  private applyTierPricing(tiers: MarketplaceEventTier[], quantity: number): number {
    let tierIndex = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (quantity <= tiers[i].limit || tiers[i].limit === null) {
        tierIndex = i + 1;
        break;
      }
    }
    return tierIndex;
  }
}

