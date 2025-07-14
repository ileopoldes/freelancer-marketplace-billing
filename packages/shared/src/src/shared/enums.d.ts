/**
 * Shared enums for consistent status values across the application
 * These mirror the Prisma schema enums to maintain consistency
 */
export declare enum ContractStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    CANCELED = "CANCELED",
    EXPIRED = "EXPIRED"
}
export declare enum CreditType {
    MANUAL = "MANUAL",
    REFUND = "REFUND",
    ADJUSTMENT = "ADJUSTMENT",
    PROMOTIONAL = "PROMOTIONAL"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum JobStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    OPEN = "OPEN",
    PAID = "PAID",
    VOID = "VOID",
    UNCOLLECTIBLE = "UNCOLLECTIBLE"
}
export declare enum LineType {
    BASE_FEE = "BASE_FEE",
    MINIMUM_COMMIT = "MINIMUM_COMMIT",
    USAGE_OVERAGE = "USAGE_OVERAGE",
    DISCOUNT = "DISCOUNT",
    CREDIT = "CREDIT",
    TAX = "TAX"
}
export declare enum BillingTrigger {
    AUTOMATIC = "AUTOMATIC",
    MANUAL = "MANUAL",
    SCHEDULED = "SCHEDULED",
    RETRY = "RETRY"
}
export declare enum UsageEventType {
    API_CALL = "api_call",
    BANDWIDTH = "bandwidth",
    STORAGE = "storage",
    COMPUTE = "compute",
    CUSTOM = "custom"
}
export declare enum Currency {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    CAD = "CAD"
}
export declare enum InvoicePrefix {
    STANDARD = "INV",
    CREDIT_NOTE = "CN",
    DEBIT_NOTE = "DN",
    PROFORMA = "PRO"
}
export declare enum ProrationStrategy {
    DAILY = "daily",
    HOURLY = "hourly",
    IMMEDIATE = "immediate",
    NEXT_CYCLE = "next_cycle",
    NONE = "none"
}
export declare enum DiscountType {
    PERCENTAGE = "percentage",
    FIXED_AMOUNT = "fixed_amount",
    USAGE_BASED = "usage_based",
    BULK = "bulk"
}
export declare enum DiscountSchedule {
    ONE_TIME = "one_time",
    RECURRING = "recurring",
    PROGRESSIVE = "progressive",
    CONDITIONAL = "conditional"
}
export declare enum AdjustmentType {
    UPGRADE = "upgrade",
    DOWNGRADE = "downgrade",
    ADD_ON = "add_on",
    REMOVAL = "removal"
}
export declare enum BillingFrequency {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    WEEKLY = "weekly",
    CUSTOM = "custom"
}
export declare enum TimeZone {
    UTC = "UTC",
    EST = "America/New_York",
    PST = "America/Los_Angeles",
    GMT = "Europe/London"
}
//# sourceMappingURL=enums.d.ts.map