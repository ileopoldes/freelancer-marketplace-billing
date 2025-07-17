import { PrismaClient, MarketplaceEvent } from "@prisma/client";
import { Money, createMoney, addMoney } from "@marketplace/shared";
import {
  PayAsYouGoPricer,
  PayAsYouGoCalculation,
} from "../pricing/PayAsYouGoPricer";
import { CreditPackageManager } from "./CreditPackageManager";

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
    // 1. Validate the event request
    await this.validateEventRequest(eventRequest);

    // 2. Calculate pricing for the event
    const calculation = await this.payAsYouGoPricer.calculateEventPricing(
      eventRequest.entityId,
      eventRequest.eventType,
      eventRequest.quantity,
    );

    // 3. Store the marketplace event
    const marketplaceEvent = await this.prisma.marketplaceEvent.create({
      data: {
        entityId: eventRequest.entityId,
        userId: eventRequest.userId,
        eventType: eventRequest.eventType,
        quantity: eventRequest.quantity,
        unitPrice: calculation.finalAmount.amount
          .div(eventRequest.quantity)
          .toNumber(),
        metadata: eventRequest.metadata
          ? JSON.stringify(eventRequest.metadata)
          : null,
      },
    });

    // 4. Determine billing method (credits vs invoice)
    if (!options.forceInvoicing) {
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
        // Try to deduct from credits
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
          // Credit deduction failed, fall back to invoicing
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

    // 5. Fall back to invoice generation
    return {
      success: true,
      eventId: marketplaceEvent.id,
      calculation,
      billingMethod: "INVOICE",
      reason: options.forceInvoicing
        ? "Forced invoicing"
        : "Insufficient credits",
    };
  }

  /**
   * Process multiple events in batch
   */
  async processBatchEvents(
    events: MarketplaceEventRequest[],
    options: EventProcessingOptions = {},
  ): Promise<EventProcessingResult[]> {
    const results: EventProcessingResult[] = [];

    for (const event of events) {
      try {
        const result = await this.processEvent(event, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          eventId: "",
          calculation: {
            eventType: event.eventType,
            quantity: event.quantity,
            baseAmount: createMoney("0"),
            discountApplied: createMoney("0"),
            finalAmount: createMoney("0"),
          },
          billingMethod: "INVOICE",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
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
    // Validate entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: eventRequest.entityId },
      select: { id: true },
    });

    if (!entity) {
      throw new Error(`Entity ${eventRequest.entityId} not found`);
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
      throw new Error(
        `User ${eventRequest.userId} is not an active member of entity ${eventRequest.entityId}`,
      );
    }

    // Validate event quantity
    if (eventRequest.quantity <= 0) {
      throw new Error("Event quantity must be greater than zero");
    }

    // Validate event type
    const validEventTypes = ["project_posted", "freelancer_hired", "custom"];
    if (!validEventTypes.includes(eventRequest.eventType)) {
      throw new Error(`Invalid event type: ${eventRequest.eventType}`);
    }
  }
}
