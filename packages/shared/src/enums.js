"use strict";
/**
 * Shared enums for consistent status values across the application
 * These mirror the Prisma schema enums to maintain consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeZone = exports.BillingFrequency = exports.AdjustmentType = exports.DiscountSchedule = exports.DiscountType = exports.ProrationStrategy = exports.InvoicePrefix = exports.Currency = exports.UsageEventType = exports.BillingTrigger = exports.LineType = exports.InvoiceStatus = exports.JobStatus = exports.PaymentStatus = exports.CreditType = exports.ContractStatus = void 0;
// Contract status values
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["ACTIVE"] = "ACTIVE";
    ContractStatus["PAUSED"] = "PAUSED";
    ContractStatus["CANCELED"] = "CANCELED";
    ContractStatus["EXPIRED"] = "EXPIRED";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
// Credit type values
var CreditType;
(function (CreditType) {
    CreditType["MANUAL"] = "MANUAL";
    CreditType["REFUND"] = "REFUND";
    CreditType["ADJUSTMENT"] = "ADJUSTMENT";
    CreditType["PROMOTIONAL"] = "PROMOTIONAL";
})(CreditType || (exports.CreditType = CreditType = {}));
// Payment status values
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// Job status values
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["RUNNING"] = "RUNNING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
// Invoice status values
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["OPEN"] = "OPEN";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
// Line type values
var LineType;
(function (LineType) {
    LineType["BASE_FEE"] = "BASE_FEE";
    LineType["MINIMUM_COMMIT"] = "MINIMUM_COMMIT";
    LineType["USAGE_OVERAGE"] = "USAGE_OVERAGE";
    LineType["DISCOUNT"] = "DISCOUNT";
    LineType["CREDIT"] = "CREDIT";
    LineType["TAX"] = "TAX";
})(LineType || (exports.LineType = LineType = {}));
// Billing trigger types
var BillingTrigger;
(function (BillingTrigger) {
    BillingTrigger["AUTOMATIC"] = "AUTOMATIC";
    BillingTrigger["MANUAL"] = "MANUAL";
    BillingTrigger["SCHEDULED"] = "SCHEDULED";
    BillingTrigger["RETRY"] = "RETRY";
})(BillingTrigger || (exports.BillingTrigger = BillingTrigger = {}));
// Usage event types
var UsageEventType;
(function (UsageEventType) {
    UsageEventType["API_CALL"] = "api_call";
    UsageEventType["BANDWIDTH"] = "bandwidth";
    UsageEventType["STORAGE"] = "storage";
    UsageEventType["COMPUTE"] = "compute";
    UsageEventType["CUSTOM"] = "custom";
})(UsageEventType || (exports.UsageEventType = UsageEventType = {}));
// Currency codes
var Currency;
(function (Currency) {
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["CAD"] = "CAD";
})(Currency || (exports.Currency = Currency = {}));
// Invoice number prefixes
var InvoicePrefix;
(function (InvoicePrefix) {
    InvoicePrefix["STANDARD"] = "INV";
    InvoicePrefix["CREDIT_NOTE"] = "CN";
    InvoicePrefix["DEBIT_NOTE"] = "DN";
    InvoicePrefix["PROFORMA"] = "PRO";
})(InvoicePrefix || (exports.InvoicePrefix = InvoicePrefix = {}));
// Proration strategies
var ProrationStrategy;
(function (ProrationStrategy) {
    ProrationStrategy["DAILY"] = "daily";
    ProrationStrategy["HOURLY"] = "hourly";
    ProrationStrategy["IMMEDIATE"] = "immediate";
    ProrationStrategy["NEXT_CYCLE"] = "next_cycle";
    ProrationStrategy["NONE"] = "none";
})(ProrationStrategy || (exports.ProrationStrategy = ProrationStrategy = {}));
// Discount types
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "percentage";
    DiscountType["FIXED_AMOUNT"] = "fixed_amount";
    DiscountType["USAGE_BASED"] = "usage_based";
    DiscountType["BULK"] = "bulk";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
// Discount schedule types
var DiscountSchedule;
(function (DiscountSchedule) {
    DiscountSchedule["ONE_TIME"] = "one_time";
    DiscountSchedule["RECURRING"] = "recurring";
    DiscountSchedule["PROGRESSIVE"] = "progressive";
    DiscountSchedule["CONDITIONAL"] = "conditional";
})(DiscountSchedule || (exports.DiscountSchedule = DiscountSchedule = {}));
// Mid-cycle adjustment types
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["UPGRADE"] = "upgrade";
    AdjustmentType["DOWNGRADE"] = "downgrade";
    AdjustmentType["ADD_ON"] = "add_on";
    AdjustmentType["REMOVAL"] = "removal";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
// Billing frequencies
var BillingFrequency;
(function (BillingFrequency) {
    BillingFrequency["MONTHLY"] = "monthly";
    BillingFrequency["QUARTERLY"] = "quarterly";
    BillingFrequency["YEARLY"] = "yearly";
    BillingFrequency["WEEKLY"] = "weekly";
    BillingFrequency["CUSTOM"] = "custom";
})(BillingFrequency || (exports.BillingFrequency = BillingFrequency = {}));
// Time zones
var TimeZone;
(function (TimeZone) {
    TimeZone["UTC"] = "UTC";
    TimeZone["EST"] = "America/New_York";
    TimeZone["PST"] = "America/Los_Angeles";
    TimeZone["GMT"] = "Europe/London";
})(TimeZone || (exports.TimeZone = TimeZone = {}));
//# sourceMappingURL=enums.js.map