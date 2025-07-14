import { z } from "zod";
import Decimal from "decimal.js";
export type Money = {
  amount: Decimal;
  currency: string;
};
export declare const CreateCustomerSchema: z.ZodObject<
  {
    email: z.ZodString;
    name: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string;
    email?: string;
    company?: string;
    address?: string;
    taxId?: string;
  },
  {
    name?: string;
    email?: string;
    company?: string;
    address?: string;
    taxId?: string;
  }
>;
export declare const CreateProductSchema: z.ZodObject<
  {
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["RECURRING", "ONE_TIME", "USAGE_BASED"]>;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string;
    description?: string;
    type?: "RECURRING" | "ONE_TIME" | "USAGE_BASED";
  },
  {
    name?: string;
    description?: string;
    type?: "RECURRING" | "ONE_TIME" | "USAGE_BASED";
  }
>;
export declare const CreatePriceSchema: z.ZodObject<
  {
    productId: z.ZodString;
    amount: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    interval: z.ZodOptional<z.ZodEnum<["DAY", "WEEK", "MONTH", "YEAR"]>>;
    intervalCount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    usageType: z.ZodOptional<z.ZodEnum<["LICENSED", "METERED"]>>;
    billingScheme: z.ZodDefault<
      z.ZodEnum<["PER_UNIT", "TIERED", "VOLUME", "GRADUATED"]>
    >;
    tieredPricing: z.ZodOptional<z.ZodAny>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    interval?: "DAY" | "WEEK" | "MONTH" | "YEAR";
    metadata?: Record<string, string>;
    amount?: string;
    currency?: string;
    productId?: string;
    intervalCount?: number;
    usageType?: "LICENSED" | "METERED";
    billingScheme?: "PER_UNIT" | "TIERED" | "VOLUME" | "GRADUATED";
    tieredPricing?: any;
  },
  {
    interval?: "DAY" | "WEEK" | "MONTH" | "YEAR";
    metadata?: Record<string, string>;
    amount?: string;
    currency?: string;
    productId?: string;
    intervalCount?: number;
    usageType?: "LICENSED" | "METERED";
    billingScheme?: "PER_UNIT" | "TIERED" | "VOLUME" | "GRADUATED";
    tieredPricing?: any;
  }
>;
export declare const CreateSubscriptionSchema: z.ZodObject<
  {
    customerId: z.ZodString;
    items: z.ZodArray<
      z.ZodObject<
        {
          productId: z.ZodString;
          priceId: z.ZodString;
          quantity: z.ZodDefault<z.ZodNumber>;
        },
        "strip",
        z.ZodTypeAny,
        {
          quantity?: number;
          productId?: string;
          priceId?: string;
        },
        {
          quantity?: number;
          productId?: string;
          priceId?: string;
        }
      >,
      "many"
    >;
    currentPeriodStart: z.ZodOptional<z.ZodDate>;
    currentPeriodEnd: z.ZodOptional<z.ZodDate>;
    trialStart: z.ZodOptional<z.ZodDate>;
    trialEnd: z.ZodOptional<z.ZodDate>;
    recurrenceRule: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    metadata?: Record<string, string>;
    customerId?: string;
    recurrenceRule?: string;
    items?: {
      quantity?: number;
      productId?: string;
      priceId?: string;
    }[];
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialStart?: Date;
    trialEnd?: Date;
  },
  {
    metadata?: Record<string, string>;
    customerId?: string;
    recurrenceRule?: string;
    items?: {
      quantity?: number;
      productId?: string;
      priceId?: string;
    }[];
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialStart?: Date;
    trialEnd?: Date;
  }
>;
export declare const RecordUsageSchema: z.ZodObject<
  {
    customerId: z.ZodString;
    productId: z.ZodString;
    priceId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    timestamp: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    metadata?: Record<string, string>;
    customerId?: string;
    quantity?: number;
    timestamp?: Date;
    productId?: string;
    priceId?: string;
  },
  {
    metadata?: Record<string, string>;
    customerId?: string;
    quantity?: number;
    timestamp?: Date;
    productId?: string;
    priceId?: string;
  }
>;
export declare const CreateInvoiceSchema: z.ZodObject<
  {
    customerId: z.ZodString;
    subscriptionId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<
      z.ZodObject<
        {
          priceId: z.ZodOptional<z.ZodString>;
          description: z.ZodString;
          quantity: z.ZodDefault<z.ZodNumber>;
          unitAmount: z.ZodString;
          currency: z.ZodDefault<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          description?: string;
          currency?: string;
          quantity?: number;
          unitAmount?: string;
          priceId?: string;
        },
        {
          description?: string;
          currency?: string;
          quantity?: number;
          unitAmount?: string;
          priceId?: string;
        }
      >,
      "many"
    >;
    periodStart: z.ZodDate;
    periodEnd: z.ZodDate;
    dueDate: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  },
  "strip",
  z.ZodTypeAny,
  {
    metadata?: Record<string, string>;
    customerId?: string;
    periodStart?: Date;
    periodEnd?: Date;
    dueDate?: Date;
    items?: {
      description?: string;
      currency?: string;
      quantity?: number;
      unitAmount?: string;
      priceId?: string;
    }[];
    subscriptionId?: string;
  },
  {
    metadata?: Record<string, string>;
    customerId?: string;
    periodStart?: Date;
    periodEnd?: Date;
    dueDate?: Date;
    items?: {
      description?: string;
      currency?: string;
      quantity?: number;
      unitAmount?: string;
      priceId?: string;
    }[];
    subscriptionId?: string;
  }
>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type CreatePrice = z.infer<typeof CreatePriceSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type RecordUsage = z.infer<typeof RecordUsageSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
//# sourceMappingURL=types.d.ts.map
