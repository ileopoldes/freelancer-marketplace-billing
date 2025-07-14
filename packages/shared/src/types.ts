import { z } from 'zod';
import Decimal from 'decimal.js';

// Money type for perfect accuracy
export type Money = {
  amount: Decimal;
  currency: string;
};

// Validation schemas
export const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['RECURRING', 'ONE_TIME', 'USAGE_BASED']),
});

export const CreatePriceSchema = z.object({
  productId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/), // Decimal string with up to 4 decimal places
  currency: z.string().length(3).default('USD'),
  interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
  intervalCount: z.number().int().positive().default(1).optional(),
  usageType: z.enum(['LICENSED', 'METERED']).optional(),
  billingScheme: z.enum(['PER_UNIT', 'TIERED', 'VOLUME', 'GRADUATED']).default('PER_UNIT'),
  tieredPricing: z.any().optional(), // JSON for complex pricing
  metadata: z.record(z.string()).optional(),
});

export const CreateSubscriptionSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    priceId: z.string(),
    quantity: z.number().int().positive().default(1),
  })),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  trialStart: z.date().optional(),
  trialEnd: z.date().optional(),
  recurrenceRule: z.string().optional(), // RFC 5545 RRULE
  metadata: z.record(z.string()).optional(),
});

export const RecordUsageSchema = z.object({
  customerId: z.string(),
  productId: z.string(),
  priceId: z.string().optional(),
  quantity: z.number().int().positive(),
  timestamp: z.date().optional(),
  metadata: z.record(z.string()).optional(),
});

export const CreateInvoiceSchema = z.object({
  customerId: z.string(),
  subscriptionId: z.string().optional(),
  items: z.array(z.object({
    priceId: z.string().optional(),
    description: z.string(),
    quantity: z.number().int().positive().default(1),
    unitAmount: z.string().regex(/^\d+(\.\d{1,4})?$/),
    currency: z.string().length(3).default('USD'),
  })),
  periodStart: z.date(),
  periodEnd: z.date(),
  dueDate: z.date().optional(),
  metadata: z.record(z.string()).optional(),
});

// Type exports
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type CreatePrice = z.infer<typeof CreatePriceSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type RecordUsage = z.infer<typeof RecordUsageSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;

