"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceSchema =
  exports.RecordUsageSchema =
  exports.CreateSubscriptionSchema =
  exports.CreatePriceSchema =
  exports.CreateProductSchema =
  exports.CreateCustomerSchema =
    void 0;
const zod_1 = require("zod");
// Validation schemas
exports.CreateCustomerSchema = zod_1.z.object({
  email: zod_1.z.string().email(),
  name: zod_1.z.string().min(1),
  company: zod_1.z.string().optional(),
  address: zod_1.z.string().optional(),
  taxId: zod_1.z.string().optional(),
});
exports.CreateProductSchema = zod_1.z.object({
  name: zod_1.z.string().min(1),
  description: zod_1.z.string().optional(),
  type: zod_1.z.enum(["RECURRING", "ONE_TIME", "USAGE_BASED"]),
});
exports.CreatePriceSchema = zod_1.z.object({
  productId: zod_1.z.string(),
  amount: zod_1.z.string().regex(/^\d+(\.\d{1,4})?$/), // Decimal string with up to 4 decimal places
  currency: zod_1.z.string().length(3).default("USD"),
  interval: zod_1.z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).optional(),
  intervalCount: zod_1.z.number().int().positive().default(1).optional(),
  usageType: zod_1.z.enum(["LICENSED", "METERED"]).optional(),
  billingScheme: zod_1.z
    .enum(["PER_UNIT", "TIERED", "VOLUME", "GRADUATED"])
    .default("PER_UNIT"),
  tieredPricing: zod_1.z.any().optional(), // JSON for complex pricing
  metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.CreateSubscriptionSchema = zod_1.z.object({
  customerId: zod_1.z.string(),
  items: zod_1.z.array(
    zod_1.z.object({
      productId: zod_1.z.string(),
      priceId: zod_1.z.string(),
      quantity: zod_1.z.number().int().positive().default(1),
    }),
  ),
  currentPeriodStart: zod_1.z.date().optional(),
  currentPeriodEnd: zod_1.z.date().optional(),
  trialStart: zod_1.z.date().optional(),
  trialEnd: zod_1.z.date().optional(),
  recurrenceRule: zod_1.z.string().optional(), // RFC 5545 RRULE
  metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.RecordUsageSchema = zod_1.z.object({
  customerId: zod_1.z.string(),
  productId: zod_1.z.string(),
  priceId: zod_1.z.string().optional(),
  quantity: zod_1.z.number().int().positive(),
  timestamp: zod_1.z.date().optional(),
  metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.CreateInvoiceSchema = zod_1.z.object({
  customerId: zod_1.z.string(),
  subscriptionId: zod_1.z.string().optional(),
  items: zod_1.z.array(
    zod_1.z.object({
      priceId: zod_1.z.string().optional(),
      description: zod_1.z.string(),
      quantity: zod_1.z.number().int().positive().default(1),
      unitAmount: zod_1.z.string().regex(/^\d+(\.\d{1,4})?$/),
      currency: zod_1.z.string().length(3).default("USD"),
    }),
  ),
  periodStart: zod_1.z.date(),
  periodEnd: zod_1.z.date(),
  dueDate: zod_1.z.date().optional(),
  metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
//# sourceMappingURL=types.js.map
