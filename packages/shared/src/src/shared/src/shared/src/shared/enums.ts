/**
 * Shared enums for consistent status values across the application
 * These mirror the Prisma schema enums to maintain consistency
 */

// Contract status values
export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

// Credit type values
export enum CreditType {
  MANUAL = 'MANUAL',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  PROMOTIONAL = 'PROMOTIONAL',
}

// Payment status values
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Job status values
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Invoice status values
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

// Line type values
export enum LineType {
  BASE_FEE = 'BASE_FEE',
  MINIMUM_COMMIT = 'MINIMUM_COMMIT',
  USAGE_OVERAGE = 'USAGE_OVERAGE',
  DISCOUNT = 'DISCOUNT',
  CREDIT = 'CREDIT',
  TAX = 'TAX',
}

// Billing trigger types
export enum BillingTrigger {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  RETRY = 'RETRY',
}

// Usage event types
export enum UsageEventType {
  API_CALL = 'api_call',
  BANDWIDTH = 'bandwidth',
  STORAGE = 'storage',
  COMPUTE = 'compute',
  CUSTOM = 'custom',
}

// Currency codes
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
}

// Invoice number prefixes
export enum InvoicePrefix {
  STANDARD = 'INV',
  CREDIT_NOTE = 'CN',
  DEBIT_NOTE = 'DN',
  PROFORMA = 'PRO',
}

// Proration strategies
export enum ProrationStrategy {
  DAILY = 'daily',
  HOURLY = 'hourly',
  IMMEDIATE = 'immediate',
  NEXT_CYCLE = 'next_cycle',
  NONE = 'none',
}

// Discount types
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  USAGE_BASED = 'usage_based',
  BULK = 'bulk',
}

// Discount schedule types
export enum DiscountSchedule {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  PROGRESSIVE = 'progressive',
  CONDITIONAL = 'conditional',
}

// Mid-cycle adjustment types
export enum AdjustmentType {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  ADD_ON = 'add_on',
  REMOVAL = 'removal',
}

// Billing frequencies
export enum BillingFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

// Time zones
export enum TimeZone {
  UTC = 'UTC',
  EST = 'America/New_York',
  PST = 'America/Los_Angeles',
  GMT = 'Europe/London',
}

