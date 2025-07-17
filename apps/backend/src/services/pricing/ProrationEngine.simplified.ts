import { Money, createMoney } from "@marketplace/shared";

export interface ProrationResult {
  oldPlanCharge: Money;
  newPlanCharge: Money;
  total: Money;
  creditDue?: Money;
  chargeDue?: Money;
  prorationDetails: {
    totalDaysInPeriod: number;
    daysOnOldPlan: number;
    daysOnNewPlan: number;
    effectiveDate: Date;
  };
}

/**
 * Simplified ProrationEngine that doesn't perform any proration
 * All changes take effect on the next billing cycle
 */
export class ProrationEngine {
  /**
   * No-op proration - returns the full amount
   * @param amount The amount (returned as-is)
   * @param _totalDays Ignored
   * @param _usedDays Ignored
   * @returns The full amount without proration
   */
  calculateDailyProration(
    amount: Money,
    _totalDays: number,
    _usedDays: number,
  ): Money {
    return amount;
  }

  /**
   * No-op date-based proration - returns the full amount
   * @param amount The amount (returned as-is)
   * @param _startDate Ignored
   * @param _endDate Ignored
   * @param _actualStartDate Ignored
   * @param _actualEndDate Ignored
   * @returns The full amount without proration
   */
  calculateDateBasedProration(
    amount: Money,
    _startDate: Date,
    _endDate: Date,
    _actualStartDate: Date,
    _actualEndDate: Date,
  ): Money {
    return amount;
  }

  /**
   * No-op monthly proration - returns the full amount
   * @param amount The amount (returned as-is)
   * @param _year Ignored
   * @param _month Ignored
   * @param _usedDays Ignored
   * @returns The full amount without proration
   */
  calculateMonthlyProration(
    amount: Money,
    _year: number,
    _month: number,
    _usedDays: number,
  ): Money {
    return amount;
  }

  /**
   * Calculate days between two dates (inclusive)
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of days between dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiffMs = endDate.getTime() - startDate.getTime();
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
    return Math.floor(timeDiffDays) + 1; // +1 to make it inclusive
  }

  /**
   * Get number of days in a specific month
   * @param year Year
   * @param month Month (1-12)
   * @returns Number of days in the month
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Check if a year is a leap year
   * @param year Year to check
   * @returns True if leap year
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Handle month-end edge cases for billing dates
   * Ensures consistency when billing on the last day of months with different lengths
   */
  normalizeMonthEndDate(
    date: Date,
    targetMonth: number,
    targetYear: number,
  ): Date {
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const originalDay = date.getDate();

    // If original date was end of month, use end of target month
    const originalLastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    if (originalDay === originalLastDay) {
      return new Date(targetYear, targetMonth - 1, lastDayOfTargetMonth);
    }

    // Otherwise, use the original day or last day of month, whichever is smaller
    const dayToUse = Math.min(originalDay, lastDayOfTargetMonth);
    return new Date(targetYear, targetMonth - 1, dayToUse);
  }
}
