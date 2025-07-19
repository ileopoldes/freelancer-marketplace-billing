import { PrismaClient, MarketplaceEvent } from "@prisma/client";
import { Money, createMoney, addMoney } from "@marketplace/shared";
import {
  PayAsYouGoPricer,
  PayAsYouGoCalculation,
} from "../pricing/PayAsYouGoPricer";
import { CreditPackageManager } from "./CreditPackageManager";

// Custom error classes
export class MarketplaceEventError extends Error {
  constructor(
    message: string,
    public eventId?: string,
    public entityId?: string,
  ) {
    super(message);
    this.name = "MarketplaceEventError";
  }
}

export class ValidationError extends MarketplaceEventError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class CreditDeductionError extends MarketplaceEventError {
  constructor(
    message: string,
    public availableCredits?: Money,
    public requiredCredits?: Money,
  ) {
    super(message);
    this.name = "CreditDeductionError";
  }
}

export interface MarketplaceEventRequest {
  entityId: string;
  userId: string;
  eventType: "project_posted" | "freelancer_hired" | "custom";
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface EventProcessingResult {
  success: boolean;
  eventId: string;
  calculation: PayAsYouGoCalculation;
  billingMethod: "CREDITS" | "INVOICE";
  creditDeduction?: {
    deductedAmount: Money;
    remainingBalance: Money;
  };
  reason?: string;
}

export interface EventProcessingOptions {
  forceInvoicing?: boolean; // Force invoice generation instead of credit deduction
  skipCreditLimitCheck?: boolean; // Skip user credit limit validation
}

/**
 * Service for processing marketplace events and applying billing logic
 * Handles both credit deduction and invoice generation for pay-as-you-go events
 */
export class MarketplaceEventProcessor {
  private prisma: PrismaClient;
  private payAsYouGoPricer: PayAsYouGoPricer;
  private creditPackageManager: CreditPackageManager;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.payAsYouGoPricer = new PayAsYouGoPricer(prisma);
    this.creditPackageManager = new CreditPackageManager(prisma);
  }

  /**
   * Process a marketplace event and determine billing method
   */
  async processEvent(
    eventRequest: MarketplaceEventRequest,
    options: EventProcessingOptions = {},
  ): Promise<EventProcessingResult> {
    await this.validateEventRequest(eventRequest);
    const calculation = await this.calculateEventPricing(eventRequest);
    const marketplaceEvent = await this.storeMarketplaceEvent(
      eventRequest,
      calculation,
    );

    if (!options.forceInvoicing) {
      const result = await this.attemptCreditDeduction(
        eventRequest,
        calculation,
        marketplaceEvent,
      );
      if (result) return result;
    }

    return this.generateInvoiceFallback(
      eventRequest,
      marketplaceEvent.id,
      calculation,
      options.forceInvoicing,
    );
  }

  private async calculateEventPricing(
    eventRequest: MarketplaceEventRequest,
  ): Promise<PayAsYouGoCalculation> {
    return this.payAsYouGoPricer.calculateEventPricing(
      eventRequest.entityId,
      eventRequest.eventType,
      eventRequest.quantity,
    );
  }

  private async storeMarketplaceEvent(
    eventRequest: MarketplaceEventRequest,
    calculation: PayAsYouGoCalculation,
  ): Promise<MarketplaceEvent> {
    return this.prisma.marketplaceEvent.create({
      data: {
        entityId: eventRequest.entityId,
        userId: eventRequest.userId,
        eventType: eventRequest.eventType,
        quantity: eventRequest.quantity,
        unitPrice: calculation.finalAmount.amount.div(eventRequest.quantity),
        metadata: eventRequest.metadata as any,
      },
    });
  }

  private async attemptCreditDeduction(
    eventRequest: MarketplaceEventRequest,
    calculation: PayAsYouGoCalculation,
    marketplaceEvent: MarketplaceEvent,
  ): Promise<EventProcessingResult | null> {
    const creditBalance =
      await this.creditPackageManager.getEntityCreditBalance(
        eventRequest.entityId,
      );

    if (
      creditBalance &&
      creditBalance.availableCredits.amount.greaterThanOrEqualTo(
        calculation.finalAmount.amount,
      )
    ) {
      const deductionResult =
        await this.creditPackageManager.deductCreditsForEvent(
          eventRequest.entityId,
          eventRequest.userId,
          eventRequest.eventType,
          calculation.finalAmount,
          `${eventRequest.eventType} event processing`,
        );

      if (deductionResult.success) {
        return {
          success: true,
          eventId: marketplaceEvent.id,
          calculation,
          billingMethod: "CREDITS",
          creditDeduction: {
            deductedAmount: deductionResult.deductedAmount,
            remainingBalance: deductionResult.remainingBalance,
          },
        };
      } else {
        return {
          success: true,
          eventId: marketplaceEvent.id,
          calculation,
          billingMethod: "INVOICE",
          reason: `Credit deduction failed: ${deductionResult.reason}`,
        };
      }
    }
  }

  private generateInvoiceFallback(
    eventRequest: MarketplaceEventRequest,
    eventId: string,
    calculation: PayAsYouGoCalculation,
    forceInvoicing: boolean,
  ): EventProcessingResult {
    return {
      success: true,
      eventId,
      calculation,
      billingMethod: "INVOICE",
      reason: forceInvoicing ? "Forced invoicing" : "Insufficient credits",
    };
  }

  /**
   * Process multiple events in batch
   */
  async processBatchEvents(
    events: MarketplaceEventRequest[],
    options: EventProcessingOptions = {},
  ): Promise<EventProcessingResult[]> {
    const eventPromises = events.map(async (event) => {
      try {
        return await this.processEvent(event, options);
      } catch (error) {
        return {
          success: false,
          eventId: "",
          calculation: {
            eventType: event.eventType,
            quantity: event.quantity,
            baseAmount: createMoney("0"),
            discountApplied: createMoney("0"),
            finalAmount: createMoney("0"),
          },
          billingMethod: "INVOICE" as const,
          reason: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    return Promise.all(eventPromises);
  }

  /**
   * Get event processing history for an entity
   */
  async getEventHistory(
    entityId: string,
    fromDate: Date,
    toDate: Date,
    eventType?: string,
  ): Promise<
    (MarketplaceEvent & { user: { id: string; name: string; email: string } })[]
  > {
    return this.prisma.marketplaceEvent.findMany({
      where: {
        entityId,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
        ...(eventType && { eventType }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Get billing summary for an entity across all event types
   */
  async getBillingSummary(
    entityId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalEvents: number;
    totalCost: Money;
    eventBreakdown: Array<{
      eventType: string;
      count: number;
      totalCost: Money;
    }>;
    billingMethodBreakdown: {
      creditsBilled: Money;
      invoicesBilled: Money;
    };
  }> {
    const events = await this.getEventHistory(entityId, fromDate, toDate);

    const totalEvents = events.length;
    const eventGroups = events.reduce(
      (acc, event) => {
        if (!acc[event.eventType]) {
          acc[event.eventType] = { count: 0, totalCost: createMoney("0") };
        }
        acc[event.eventType].count += event.quantity;
        acc[event.eventType].totalCost = addMoney(
          acc[event.eventType].totalCost,
          createMoney((Number(event.unitPrice) * event.quantity).toString()),
        );
        return acc;
      },
      {} as Record<string, { count: number; totalCost: Money }>,
    );

    const eventBreakdown = Object.entries(eventGroups).map(
      ([eventType, data]) => ({
        eventType,
        count: (data as { count: number; totalCost: Money }).count,
        totalCost: (data as { count: number; totalCost: Money }).totalCost,
      }),
    );

    const totalCost = eventBreakdown.reduce(
      (sum, event) => addMoney(sum, event.totalCost),
      createMoney("0"),
    );

    // Simplified billing method breakdown
    const billingMethodBreakdown = {
      creditsBilled: createMoney("0"),
      invoicesBilled: totalCost,
    };

    return {
      totalEvents,
      totalCost,
      eventBreakdown,
      billingMethodBreakdown,
    };
  }

  /**
   * Get current credit balance for an entity
   */
  async getCreditBalance(entityId: string): Promise<{
    creditBalance: Money;
  }> {
    const creditBalance =
      await this.creditPackageManager.getEntityCreditBalance(entityId);
    const currentBalance = creditBalance?.availableCredits || createMoney("0");

    return {
      creditBalance: currentBalance,
    };
  }

  /**
   * Validate event request before processing
   */
  private async validateEventRequest(
    eventRequest: MarketplaceEventRequest,
  ): Promise<void> {
    try {
      // Validate entity exists
      const entity = await this.prisma.entity.findUnique({
        where: { id: eventRequest.entityId },
        select: { id: true },
      });

      if (!entity) {
        throw new ValidationError(
          `Entity ${eventRequest.entityId} not found`,
          "entityId",
        );
      }

      // Validate user exists and belongs to entity
      const entityUser = await this.prisma.entityUser.findFirst({
        where: {
          entityId: eventRequest.entityId,
          userId: eventRequest.userId,
          status: "ACTIVE",
        },
      });

      if (!entityUser) {
        throw new ValidationError(
          `User ${eventRequest.userId} is not an active member of entity ${eventRequest.entityId}`,
          "userId",
        );
      }

      // Validate event quantity
      if (eventRequest.quantity <= 0) {
        throw new ValidationError(
          "Event quantity must be greater than zero",
          "quantity",
        );
      }

      // Validate event type
      const validEventTypes = ["project_posted", "freelancer_hired", "custom"];
      if (!validEventTypes.includes(eventRequest.eventType)) {
        throw new ValidationError(
          `Invalid event type: ${eventRequest.eventType}`,
          "eventType",
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new MarketplaceEventError(
        `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        eventRequest.entityId,
      );
    }
  }
}
