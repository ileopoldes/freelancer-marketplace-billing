import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface QueueMessage<T = any> {
  id: string;
  event: string;
  data: T;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface QueueProcessingOptions {
  maxRetries?: number;
  delayBetweenRetries?: number;
}

@Injectable()
export class SimpleQueueService {
  private eventEmitter: EventEmitter2;
  private queues: Map<string, QueueMessage[]> = new Map();
  private processingQueues: Map<string, boolean> = new Map();
  private handlers: Map<string, (message: QueueMessage) => Promise<void>> = new Map();

  constructor() {
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Add a message to the queue
   */
  async enqueue<T>(
    queueName: string,
    event: string,
    data: T,
    options: QueueProcessingOptions = {}
  ): Promise<string> {
    const messageId = this.generateMessageId();
    const message: QueueMessage<T> = {
      id: messageId,
      event,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
    };

    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    this.queues.get(queueName)!.push(message);
    
    // Emit event for immediate processing
    this.eventEmitter.emit(`queue.${queueName}.message`, message);
    
    return messageId;
  }

  /**
   * Register a handler for a specific queue
   */
  registerHandler(
    queueName: string,
    handler: (message: QueueMessage) => Promise<void>
  ): void {
    this.handlers.set(queueName, handler);
    
    // Listen for messages on this queue
    this.eventEmitter.on(`queue.${queueName}.message`, async (message: QueueMessage) => {
      await this.processMessage(queueName, message, handler);
    });
  }

  /**
   * Process a single message
   */
  private async processMessage(
    queueName: string,
    message: QueueMessage,
    handler: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    try {
      await handler(message);
      // Remove message from queue on success
      this.removeMessageFromQueue(queueName, message.id);
    } catch (error) {
      console.error(`Error processing message ${message.id} in queue ${queueName}:`, error);
      
      // Retry logic
      if (message.retryCount < message.maxRetries) {
        message.retryCount++;
        
        // Re-emit after delay
        setTimeout(() => {
          this.eventEmitter.emit(`queue.${queueName}.message`, message);
        }, 1000 * message.retryCount); // Exponential backoff
      } else {
        // Move to dead letter queue or log failure
        console.error(`Message ${message.id} failed after ${message.maxRetries} retries`);
        this.removeMessageFromQueue(queueName, message.id);
      }
    }
  }

  /**
   * Remove a message from queue
   */
  private removeMessageFromQueue(queueName: string, messageId: string): void {
    const queue = this.queues.get(queueName);
    if (queue) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index > -1) {
        queue.splice(index, 1);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName: string): {
    queueSize: number;
    processing: boolean;
    totalMessages: number;
  } {
    const queue = this.queues.get(queueName) || [];
    return {
      queueSize: queue.length,
      processing: this.processingQueues.get(queueName) || false,
      totalMessages: queue.length,
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all queues
   */
  getAllQueues(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Clear a queue
   */
  clearQueue(queueName: string): void {
    this.queues.set(queueName, []);
  }
}
