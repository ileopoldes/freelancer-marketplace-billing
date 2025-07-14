import { RRule } from "rrule";
/**
 * Parse an RFC 5545 RRULE string into an RRule object
 */
export declare function parseRRule(rruleString: string): RRule;
/**
 * Generate the next billing dates for a subscription
 */
export declare function getNextBillingDates(
  rruleString: string,
  startDate: Date,
  count?: number,
): Date[];
/**
 * Get the next single billing date
 */
export declare function getNextBillingDate(
  rruleString: string,
  after?: Date,
): Date | null;
/**
 * Check if a date matches the recurrence rule
 */
export declare function dateMatchesRecurrence(
  rruleString: string,
  date: Date,
): boolean;
/**
 * Get all billing dates between two dates
 */
export declare function getBillingDatesBetween(
  rruleString: string,
  startDate: Date,
  endDate: Date,
): Date[];
/**
 * Create common RRULE strings for billing intervals
 */
export declare const BillingRules: {
  /**
   * Every month on the same day
   */
  monthly: (dayOfMonth?: number) => string;
  /**
   * Every year on the same date
   */
  yearly: (month?: number, dayOfMonth?: number) => string;
  /**
   * Every week on the same day
   */
  weekly: (dayOfWeek?: number) => string;
  /**
   * Every N days
   */
  daily: (interval?: number) => string;
  /**
   * Custom interval
   */
  custom: (
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    interval?: number,
  ) => string;
  /**
   * End of month billing (last day of each month)
   */
  endOfMonth: () => string;
  /**
   * Quarterly billing (every 3 months)
   */
  quarterly: (dayOfMonth?: number) => string;
  /**
   * Semi-annual billing (every 6 months)
   */
  semiAnnual: (dayOfMonth?: number) => string;
};
/**
 * Validate an RRULE string
 */
export declare function validateRRule(rruleString: string): {
  valid: boolean;
  error?: string;
};
/**
 * Convert simple interval to RRULE
 */
export declare function intervalToRRule(
  interval: "DAY" | "WEEK" | "MONTH" | "YEAR",
  intervalCount?: number,
  startDate?: Date,
): string;
//# sourceMappingURL=recurrence.d.ts.map
