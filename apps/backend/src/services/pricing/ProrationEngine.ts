import {
  Money,
  createMoney,
  divideMoney,
  multiplyMoney,
  addMoney,
  subtractMoney,
} from "@marketplace/shared";

export interface ProrationPeriod {
  startDate: Date;
  endDate: Date;
  amount: Money;
}

export interface PlanChange {
  changeDate: Date;
  oldPlanAmount: Money;
  newPlanAmount: Money;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ProrationResult {
  oldPlanCharge: Money;
  newPlanCharge: Money;
  total: Money;
  creditDue?: Money; // If downgrade results in credit
  chargeDue?: Money; // If upgrade requires additional charge
  prorationDetails: {
    totalDaysInPeriod: number;
    daysOnOldPlan: number;
    daysOnNewPlan: number;
    effectiveDate: Date;
  };
}

export interface MidCycleAdjustment {
  type: "upgrade" | "downgrade" | "add_on" | "removal";
  adjustmentDate: Date;
  oldAmount: Money;
  newAmount: Money;
  prorationStrategy: "daily" | "immediate" | "next_cycle";
}

/**
 * Enhanced service for calculating accurate proration for billing periods
 * Handles various edge cases including leap years, month-end dates, and complex mid-cycle changes
 */
export class ProrationEngine {
  /**
   * Calculate daily proration for a given amount and period
   *
   * @param amount The total amount to prorate
   * @param totalDays Total days in the billing period
   * @param usedDays Number of days actually used
   * @returns Prorated amount
   */
  calculateDailyProration(
    amount: Money,
    totalDays: number,
    usedDays: number,
  ): Money {
    this.validateProrationInputs(totalDays, usedDays);

    if (usedDays === 0) {
      return createMoney("0", amount.currency);
    }

    if (usedDays === totalDays) {
      return amount;
    }

    // Calculate daily rate and multiply by used days
    const dailyRate = divideMoney(amount, totalDays);
    return multiplyMoney(dailyRate, usedDays);
  }

  /**
   * Calculate proration based on actual dates
   *
   * @param amount The total amount to prorate
   * @param startDate Start of the billing period
   * @param endDate End of the billing period
   * @param actualStartDate When service actually started
   * @param actualEndDate When service actually ended
   * @returns Prorated amount
   */
  calculateDateBasedProration(
    amount: Money,
    startDate: Date,
    endDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
  ): Money {
    // Validate date inputs
    if (startDate >= endDate) {
      throw new Error("Start date must be before end date");
    }

    if (actualStartDate > actualEndDate) {
      throw new Error("Actual start date must be before actual end date");
    }

    // Calculate total days in billing period
    const totalDays = this.calculateDaysBetween(startDate, endDate);

    // Calculate actual usage period within billing period
    const usageStart =
      actualStartDate < startDate ? startDate : actualStartDate;
    const usageEnd = actualEndDate > endDate ? endDate : actualEndDate;

    // If no overlap, return zero
    if (usageStart >= usageEnd) {
      return createMoney("0", amount.currency);
    }

    const usedDays = this.calculateDaysBetween(usageStart, usageEnd);

    return this.calculateDailyProration(amount, totalDays, usedDays);
  }

  /**
   * Calculate proration for mid-cycle plan changes
   *
   * @param periods Array of periods with different amounts
   * @returns Total prorated amount
   */
  calculateMultiPeriodProration(periods: ProrationPeriod[]): Money {
    if (!periods || periods.length === 0) {
      throw new Error("At least one proration period must be provided");
    }

    let total = createMoney("0", periods[0].amount.currency);

    for (const period of periods) {
      const days = this.calculateDaysBetween(period.startDate, period.endDate);
      if (days > 0) {
        total = addMoney(total, period.amount);
      }
    }

    return total;
  }

  /**
   * Calculate proration for plan upgrade/downgrade scenarios
   *
   * @param oldPlanAmount Amount of the old plan
   * @param newPlanAmount Amount of the new plan
   * @param totalDaysInPeriod Total days in billing period
   * @param daysOnOldPlan Days on old plan
   * @param daysOnNewPlan Days on new plan
   * @returns Object with old plan charge, new plan charge, and total
   */
  calculatePlanChangeProration(
    oldPlanAmount: Money,
    newPlanAmount: Money,
    totalDaysInPeriod: number,
    daysOnOldPlan: number,
    daysOnNewPlan: number,
  ): {
    oldPlanCharge: Money;
    newPlanCharge: Money;
    total: Money;
    savings: Money; // Positive if upgrade costs more, negative if downgrade saves
  } {
    this.validateProrationInputs(totalDaysInPeriod, daysOnOldPlan);
    this.validateProrationInputs(totalDaysInPeriod, daysOnNewPlan);

    if (daysOnOldPlan + daysOnNewPlan !== totalDaysInPeriod) {
      throw new Error(
        "Days on old plan plus days on new plan must equal total days in period",
      );
    }

    const oldPlanCharge = this.calculateDailyProration(
      oldPlanAmount,
      totalDaysInPeriod,
      daysOnOldPlan,
    );
    const newPlanCharge = this.calculateDailyProration(
      newPlanAmount,
      totalDaysInPeriod,
      daysOnNewPlan,
    );
    const total = addMoney(oldPlanCharge, newPlanCharge);

    // Calculate what the full month would have cost on each plan
    const fullOldPlanCost = oldPlanAmount;

    // Calculate savings (difference from staying on old plan)
    const savings = {
      amount: total.amount.minus(fullOldPlanCost.amount),
      currency: total.currency,
    };

    return {
      oldPlanCharge,
      newPlanCharge,
      total,
      savings,
    };
  }

  /**
   * Calculate days between two dates (inclusive)
   *
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
   *
   * @param year Year
   * @param month Month (1-12)
   * @returns Number of days in the month
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Check if a year is a leap year
   *
   * @param year Year to check
   * @returns True if leap year
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Calculate proration for a specific month, handling leap years
   *
   * @param amount Amount to prorate
   * @param year Year
   * @param month Month (1-12)
   * @param usedDays Days used in the month
   * @returns Prorated amount
   */
  calculateMonthlyProration(
    amount: Money,
    year: number,
    month: number,
    usedDays: number,
  ): Money {
    const daysInMonth = this.getDaysInMonth(year, month);
    return this.calculateDailyProration(amount, daysInMonth, usedDays);
  }

  /**
   * Calculate proration for mid-cycle plan changes with detailed result
   */
  calculateMidCyclePlanChange(
    planChange: PlanChange,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
  ): ProrationResult {
    const totalDaysInPeriod = this.calculateDaysBetween(
      billingPeriodStart,
      billingPeriodEnd,
    );
    const daysOnOldPlan = this.calculateDaysBetween(
      billingPeriodStart,
      planChange.changeDate,
    );
    const daysOnNewPlan = totalDaysInPeriod - daysOnOldPlan;

    // Calculate charges for each plan period
    const oldPlanCharge = this.calculateDailyProration(
      planChange.oldPlanAmount,
      totalDaysInPeriod,
      daysOnOldPlan,
    );

    const newPlanCharge = this.calculateDailyProration(
      planChange.newPlanAmount,
      totalDaysInPeriod,
      daysOnNewPlan,
    );

    const total = addMoney(oldPlanCharge, newPlanCharge);

    // Determine if this is an upgrade or downgrade
    const isUpgrade = planChange.newPlanAmount.amount.greaterThan(
      planChange.oldPlanAmount.amount,
    );
    const planDifference = subtractMoney(
      planChange.newPlanAmount,
      planChange.oldPlanAmount,
    );

    // Calculate additional charge or credit due
    const adjustmentAmount = this.calculateDailyProration(
      planDifference,
      totalDaysInPeriod,
      daysOnNewPlan,
    );

    return {
      oldPlanCharge,
      newPlanCharge,
      total,
      creditDue: isUpgrade
        ? undefined
        : createMoney(
            adjustmentAmount.amount.abs().toString(),
            adjustmentAmount.currency,
          ),
      chargeDue: isUpgrade ? adjustmentAmount : undefined,
      prorationDetails: {
        totalDaysInPeriod,
        daysOnOldPlan,
        daysOnNewPlan,
        effectiveDate: planChange.changeDate,
      },
    };
  }

  /**
   * Process multiple mid-cycle adjustments
   */
  processMidCycleAdjustments(
    adjustments: MidCycleAdjustment[],
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    basePlanAmount: Money,
  ): {
    totalAdjustments: Money;
    adjustmentBreakdown: Array<{
      adjustment: MidCycleAdjustment;
      prorationResult: ProrationResult;
    }>;
    finalAmount: Money;
  } {
    let totalAdjustments = createMoney("0", basePlanAmount.currency);
    const adjustmentBreakdown: Array<{
      adjustment: MidCycleAdjustment;
      prorationResult: ProrationResult;
    }> = [];

    // Sort adjustments by date
    const sortedAdjustments = adjustments.sort(
      (a, b) => a.adjustmentDate.getTime() - b.adjustmentDate.getTime(),
    );

    for (const adjustment of sortedAdjustments) {
      if (adjustment.prorationStrategy === "next_cycle") {
        // Skip proration, apply change next cycle
        continue;
      }

      const planChange: PlanChange = {
        changeDate: adjustment.adjustmentDate,
        oldPlanAmount: adjustment.oldAmount,
        newPlanAmount: adjustment.newAmount,
        reason: `${adjustment.type} adjustment`,
      };

      const prorationResult = this.calculateMidCyclePlanChange(
        planChange,
        billingPeriodStart,
        billingPeriodEnd,
      );

      adjustmentBreakdown.push({
        adjustment,
        prorationResult,
      });

      // Add to total adjustments
      if (prorationResult.chargeDue) {
        totalAdjustments = addMoney(
          totalAdjustments,
          prorationResult.chargeDue,
        );
      }
      if (prorationResult.creditDue) {
        totalAdjustments = subtractMoney(
          totalAdjustments,
          prorationResult.creditDue,
        );
      }
    }

    const finalAmount = addMoney(basePlanAmount, totalAdjustments);

    return {
      totalAdjustments,
      adjustmentBreakdown,
      finalAmount,
    };
  }

  /**
   * Calculate usage proration for partial periods
   */
  calculateUsageProration(
    totalUsage: number,
    usageStartDate: Date,
    usageEndDate: Date,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
  ): {
    proratedUsage: number;
    usageRatio: number;
    effectivePeriod: {
      start: Date;
      end: Date;
      days: number;
    };
  } {
    // Determine effective usage period within billing period
    const effectiveStart = new Date(
      Math.max(usageStartDate.getTime(), billingPeriodStart.getTime()),
    );
    const effectiveEnd = new Date(
      Math.min(usageEndDate.getTime(), billingPeriodEnd.getTime()),
    );

    if (effectiveStart >= effectiveEnd) {
      return {
        proratedUsage: 0,
        usageRatio: 0,
        effectivePeriod: {
          start: effectiveStart,
          end: effectiveEnd,
          days: 0,
        },
      };
    }

    const totalBillingDays = this.calculateDaysBetween(
      billingPeriodStart,
      billingPeriodEnd,
    );
    const effectiveUsageDays = this.calculateDaysBetween(
      effectiveStart,
      effectiveEnd,
    );
    const usageRatio = effectiveUsageDays / totalBillingDays;
    const proratedUsage = totalUsage * usageRatio;

    return {
      proratedUsage,
      usageRatio,
      effectivePeriod: {
        start: effectiveStart,
        end: effectiveEnd,
        days: effectiveUsageDays,
      },
    };
  }

  /**
   * Calculate subscription proration with grace periods
   */
  calculateSubscriptionProrationWithGrace(params: {
    amount: Money;
    actualStart: Date;
    actualEnd: Date;
    billingStart: Date;
    billingEnd: Date;
    gracePeriodDays?: number;
  }): {
    proratedAmount: Money;
    gracePeriodApplied: boolean;
    effectivePeriod: {
      start: Date;
      end: Date;
      days: number;
    };
  } {
    const {
      amount,
      actualStart,
      actualEnd,
      billingStart,
      billingEnd,
      gracePeriodDays = 0,
    } = params;
    // Apply grace period adjustment
    const graceAdjustedStart = new Date(actualStart);
    graceAdjustedStart.setDate(graceAdjustedStart.getDate() - gracePeriodDays);

    const effectiveStart = new Date(
      Math.max(graceAdjustedStart.getTime(), billingStart.getTime()),
    );
    const effectiveEnd = new Date(
      Math.min(actualEnd.getTime(), billingEnd.getTime()),
    );

    const totalDays = this.calculateDaysBetween(billingStart, billingEnd);
    const usedDays = this.calculateDaysBetween(effectiveStart, effectiveEnd);

    const proratedAmount = this.calculateDailyProration(
      amount,
      totalDays,
      usedDays,
    );
    const gracePeriodApplied = graceAdjustedStart < actualStart;

    return {
      proratedAmount,
      gracePeriodApplied,
      effectivePeriod: {
        start: effectiveStart,
        end: effectiveEnd,
        days: usedDays,
      },
    };
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

  /**
   * Validate proration inputs
   */
  private validateProrationInputs(totalDays: number, usedDays: number): void {
    if (totalDays <= 0) {
      throw new Error("Total days must be greater than zero");
    }

    if (usedDays < 0) {
      throw new Error("Used days cannot be negative");
    }

    if (usedDays > totalDays) {
      throw new Error("Used days cannot exceed total days");
    }
  }
}
