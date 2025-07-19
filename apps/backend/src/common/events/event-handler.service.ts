import { Injectable } from '@nestjs/common';
import { SimpleQueueService, QueueMessage } from './event-emitter.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventType } from '../enums/user-roles.enum';

export interface BillingEvent {
  type: EventType;
  entityId: string;
  userId: string;
  projectId?: string;
  contractId?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface ContractCreatedEvent extends BillingEvent {
  type: EventType.PROJECT_ASSIGNED;
  projectId: string;
  freelancerId: string;
  customerId: string;
  contractAmount: number;
}

export interface ContractApprovedEvent extends BillingEvent {
  type: EventType.PAYMENT_PROCESSED;
  contractId: string;
  fromEntityId: string;
  toUserId: string;
  amount: number;
}

export interface CreditPurchaseEvent extends BillingEvent {
  type: EventType.CREDIT_PURCHASED;
  packageAmount: number;
  creditAmount: number;
}

@Injectable()
export class EventHandlerService {
  private readonly BILLING_QUEUE = 'billing-events';
  private readonly CONTRACT_QUEUE = 'contract-events';
  private readonly PAYMENT_QUEUE = 'payment-events';

  constructor(
    private readonly queueService: SimpleQueueService,
    private readonly prisma: PrismaService,
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Register handlers for different event types
    this.queueService.registerHandler(this.BILLING_QUEUE, this.handleBillingEvent.bind(this));
    this.queueService.registerHandler(this.CONTRACT_QUEUE, this.handleContractEvent.bind(this));
    this.queueService.registerHandler(this.PAYMENT_QUEUE, this.handlePaymentEvent.bind(this));
  }

  /**
   * Emit a billing event
   */
  async emitBillingEvent(event: BillingEvent): Promise<string> {
    return this.queueService.enqueue(this.BILLING_QUEUE, event.type, event);
  }

  /**
   * Emit a contract event
   */
  async emitContractEvent(event: ContractCreatedEvent | ContractApprovedEvent): Promise<string> {
    return this.queueService.enqueue(this.CONTRACT_QUEUE, event.type, event);
  }

  /**
   * Handle billing events
   */
  private async handleBillingEvent(message: QueueMessage<BillingEvent>): Promise<void> {
    const event = message.data;
    console.log(`Processing billing event: ${event.type} for entity ${event.entityId}`);

    switch (event.type) {
      case EventType.PROJECT_CREATED:
        await this.handleProjectCreated(event);
        break;
      case EventType.CREDIT_PURCHASED:
        await this.handleCreditPurchased(event as CreditPurchaseEvent);
        break;
      case EventType.SUBSCRIPTION_RENEWED:
        await this.handleSubscriptionRenewed(event);
        break;
      default:
        console.warn(`Unhandled billing event type: ${event.type}`);
    }
  }

  /**
   * Handle contract events
   */
  private async handleContractEvent(message: QueueMessage<ContractCreatedEvent | ContractApprovedEvent>): Promise<void> {
    const event = message.data;
    console.log(`Processing contract event: ${event.type} for project ${event.projectId}`);

    switch (event.type) {
      case EventType.PROJECT_ASSIGNED:
        await this.handleProjectAssigned(event as ContractCreatedEvent);
        break;
      case EventType.PAYMENT_PROCESSED:
        await this.handleContractApproved(event as ContractApprovedEvent);
        break;
      default:
        console.warn(`Unhandled contract event type: ${(event as any).type}`);
    }
  }

  /**
   * Handle payment events
   */
  private async handlePaymentEvent(message: QueueMessage<BillingEvent>): Promise<void> {
    const event = message.data;
    console.log(`Processing payment event: ${event.type} for entity ${event.entityId}`);

    switch (event.type) {
      case EventType.PAYMENT_PROCESSED:
        await this.handlePaymentProcessed(event);
        break;
      default:
        console.warn(`Unhandled payment event type: ${event.type}`);
    }
  }

  /**
   * Handle project creation
   */
  private async handleProjectCreated(event: BillingEvent): Promise<void> {
    // Log the project creation for billing purposes
    console.log(`Project created: ${event.projectId} for entity ${event.entityId}`);
    // In a real system, this would create an audit log entry
  }

  /**
   * Handle project assignment - create contract
   */
  private async handleProjectAssigned(event: ContractCreatedEvent): Promise<void> {
    try {
      // Create contract when project is assigned
      const contract = await this.prisma.projectContract.create({
        data: {
          projectId: event.projectId,
          freelancerId: event.freelancerId,
          clientId: event.customerId,
          amount: event.contractAmount,
          status: 'DRAFT',
        },
      });

      console.log(`Contract created: ${contract.id} for project ${event.projectId}`);
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Handle contract approval - transfer credits
   */
  private async handleContractApproved(event: ContractApprovedEvent): Promise<void> {
    try {
      // Transfer credits from customer entity to freelancer
      await this.prisma.$transaction(async (tx) => {
        // Deduct credits from customer entity
        await tx.entityCreditBalance.updateMany({
          where: { entityId: event.fromEntityId },
          data: {
            usedCredits: {
              increment: event.amount,
            },
          },
        });

        // Add credits to freelancer (assuming they have an entity)
        const freelancerEntity = await tx.entity.findFirst({
          where: {
            entityUsers: {
              some: {
                userId: event.toUserId,
                role: 'FREELANCER',
              },
            },
          },
        });

        if (freelancerEntity) {
          // Check if freelancer has existing credit balance
          const existingBalance = await tx.entityCreditBalance.findFirst({
            where: { entityId: freelancerEntity.id },
          });

          if (existingBalance) {
            await tx.entityCreditBalance.updateMany({
              where: { entityId: freelancerEntity.id },
              data: {
                totalCredits: {
                  increment: event.amount,
                },
              },
            });
          } else {
            await tx.entityCreditBalance.create({
              data: {
                entityId: freelancerEntity.id,
                totalCredits: event.amount,
                usedCredits: 0,
              },
            });
          }
        }

        // Update contract status
        await tx.projectContract.update({
          where: { id: event.contractId },
          data: {
            status: 'ACTIVE',
          },
        });
      });

      console.log(`Credits transferred: ${event.amount} from ${event.fromEntityId} to freelancer ${event.toUserId}`);
    } catch (error) {
      console.error('Error processing contract approval:', error);
      throw error;
    }
  }

  /**
   * Handle credit purchase
   */
  private async handleCreditPurchased(event: CreditPurchaseEvent): Promise<void> {
    // Log credit purchase for audit
    console.log(`Credit purchased: ${event.creditAmount} credits for entity ${event.entityId}`);
    // In a real system, this would create an audit log entry
  }

  /**
   * Handle subscription renewal
   */
  private async handleSubscriptionRenewed(event: BillingEvent): Promise<void> {
    // Log subscription renewal
    console.log(`Subscription renewed for entity ${event.entityId}`);
    // In a real system, this would create an audit log entry
  }

  /**
   * Handle payment processing
   */
  private async handlePaymentProcessed(event: BillingEvent): Promise<void> {
    // Log payment processing
    console.log(`Payment processed for entity ${event.entityId}`);
    // In a real system, this would create an audit log entry
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): Record<string, any> {
    return {
      billing: this.queueService.getQueueStats(this.BILLING_QUEUE),
      contract: this.queueService.getQueueStats(this.CONTRACT_QUEUE),
      payment: this.queueService.getQueueStats(this.PAYMENT_QUEUE),
    };
  }
}
