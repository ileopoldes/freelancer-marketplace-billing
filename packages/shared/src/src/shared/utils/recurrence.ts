import { RRule, rrulestr } from "rrule";

/**
 * Parse an RFC 5545 RRULE string into an RRule object
 */
export function parseRRule(rruleString: string): RRule {
  try {
    return rrulestr(rruleString);
  } catch (error) {
    throw new Error(`Invalid RRULE: ${rruleString}`);
  }
}

/**
 * Adjust month-end dates when the target day doesn't exist in the month
 */
function adjustMonthEndDate(
  year: number,
  month: number,
  targetDay: number,
): Date {
  if (targetDay <= 0) {
    // Negative values mean "from end of month" (-1 = last day)
    return new Date(year, month + 1, 0); // Last day of the month
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  if (targetDay > lastDayOfMonth) {
    // If target day doesn't exist in this month, use last day of month
    return new Date(year, month, lastDayOfMonth);
  }

  return new Date(year, month, targetDay);
}

// --- Chain of Responsibility for Monthly Date Generation ---
type RuleInput = {
  rruleString: string;
  startDate: Date;
  count: number;
};
type Rule = (input: RuleInput, next: Rule) => Date[];

const monthlyByMonthDayRule: Rule = (input, next) => {
  const { rruleString, startDate, count } = input;
  const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
  const freqMatch = rruleString.match(/FREQ=(\w+)/);

  if (byMonthDayMatch && freqMatch && freqMatch[1] === "MONTHLY") {
    const targetDay = parseInt(byMonthDayMatch[1]);
    const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
    const dates: Date[] = [];
    let currentYear = startDate.getFullYear();
    let currentMonth = startDate.getMonth();

    for (let i = 0; i < count; i++) {
      dates.push(adjustMonthEndDate(currentYear, currentMonth, targetDay));
      currentMonth += interval;
      while (currentMonth > 11) {
        currentMonth -= 12;
        currentYear++;
      }
    }
    return dates;
  }
  return next(input, next);
};

const yearlyFeb29Rule: Rule = (input, next) => {
  const { rruleString, startDate, count } = input;
  const freqMatch = rruleString.match(/FREQ=(\w+)/);

  if (
    freqMatch &&
    freqMatch[1] === "YEARLY" &&
    rruleString.includes("BYMONTH=2;BYMONTHDAY=29")
  ) {
    const dates: Date[] = [];
    let year = startDate.getFullYear();
    while (dates.length < count) {
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        dates.push(new Date(year, 1, 29));
      }
      year++;
    }
    return dates;
  }
  return next(input, next);
};

const defaultRRuleRule: Rule = (input, _next) => {
  const { rruleString, startDate, count } = input;
  const freqMatch = rruleString.match(/FREQ=(\w+)/);
  let normalizedStartDate = startDate;
  if (freqMatch && freqMatch[1] === "WEEKLY") {
    normalizedStartDate = new Date(
      startDate.toISOString().split("T")[0] + "T12:00:00.000Z",
    );
  }
  const rrule = new RRule({
    ...parseRRule(rruleString).options,
    dtstart: normalizedStartDate,
  });
  return rrule.all((_, i) => i < count);
};

function chainRules(rules: Rule[]): Rule {
  return (input, _next) => {
    const [first, ...rest] = rules;
    if (!first) throw new Error("No rule handled the input");
    const next = rest.length
      ? chainRules(rest)
      : () => {
          throw new Error("No rule handled the input");
        };
    return first(input, next);
  };
}

const rules: Rule[] = [
  monthlyByMonthDayRule,
  yearlyFeb29Rule,
  defaultRRuleRule,
];
const generateMonthlyDatesWithAdjustment = chainRules(rules);

// --- End Chain of Responsibility ---

/**
 * Generate the next billing dates for a subscription
 */
export function getNextBillingDates(
  rruleString: string,
  startDate: Date,
  count = 12,
): Date[] {
  return generateMonthlyDatesWithAdjustment(
    { rruleString, startDate, count },
    () => {
      throw new Error("No rule handled the input");
    },
  );
}

// --- Chain of Responsibility for Next Billing Date ---
type NextDateRuleInput = {
  rruleString: string;
  after: Date;
};
type NextDateRule = (
  input: NextDateRuleInput,
  next: NextDateRule,
) => Date | null;

const nextDateCountRule: NextDateRule = (input, next) => {
  const { rruleString, after } = input;
  const countMatch = rruleString.match(/COUNT=(\d+)/);
  if (countMatch) {
    const startDate = new Date(2024, 0, 1); // Jan 1, 2024
    const rrule = new RRule({
      ...parseRRule(rruleString).options,
      dtstart: startDate,
    });
    const result = rrule.after(after, true);
    return result || null;
  }
  return next(input, next);
};

const nextDateMonthlyByMonthDayRule: NextDateRule = (input, next) => {
  const { rruleString, after } = input;
  const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
  const freqMatch = rruleString.match(/FREQ=(\w+)/);
  if (byMonthDayMatch && freqMatch && freqMatch[1] === "MONTHLY") {
    const targetDay = parseInt(byMonthDayMatch[1]);
    const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
    let nextMonth = after.getMonth() + interval;
    let nextYear = after.getFullYear();
    while (nextMonth > 11) {
      nextMonth -= 12;
      nextYear++;
    }
    let nextDate = adjustMonthEndDate(nextYear, nextMonth, targetDay);
    if (nextDate <= after) {
      nextMonth += interval;
      while (nextMonth > 11) {
        nextMonth -= 12;
        nextYear++;
      }
      nextDate = adjustMonthEndDate(nextYear, nextMonth, targetDay);
    }
    return nextDate;
  }
  return next(input, next);
};

const nextDateDefaultRRuleRule: NextDateRule = (input, _next) => {
  const { rruleString, after } = input;
  const rrule = parseRRule(rruleString);
  return rrule.after(after, true) || null;
};

function chainNextDateRules(rules: NextDateRule[]): NextDateRule {
  return (input, _next) => {
    const [first, ...rest] = rules;
    if (!first) throw new Error("No rule handled the input");
    const next = rest.length
      ? chainNextDateRules(rest)
      : () => {
          throw new Error("No rule handled the input");
        };
    return first(input, next);
  };
}

const nextDateRules: NextDateRule[] = [
  nextDateCountRule,
  nextDateMonthlyByMonthDayRule,
  nextDateDefaultRRuleRule,
];
const getNextBillingDateWithChain = chainNextDateRules(nextDateRules);
// --- End Chain of Responsibility for Next Billing Date ---

/**
 * Get the next single billing date
 */
export function getNextBillingDate(
  rruleString: string,
  after?: Date,
): Date | null {
  return getNextBillingDateWithChain(
    {
      rruleString,
      after: after || new Date(),
    },
    () => null,
  );
}

/**
 * Check if a date matches the recurrence rule
 */
export function dateMatchesRecurrence(
  rruleString: string,
  date: Date,
): boolean {
  // For month-end adjustments, check manually
  const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
  const freqMatch = rruleString.match(/FREQ=(\w+)/);

  if (byMonthDayMatch && freqMatch && freqMatch[1] === "MONTHLY") {
    const targetDay = parseInt(byMonthDayMatch[1]);

    // For negative days (from end of month)
    if (targetDay <= 0) {
      const lastDayOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      const actualTargetDay = lastDayOfMonth + targetDay + 1; // -1 means last day
      return date.getDate() === actualTargetDay;
    }

    // For positive days, handle month-end adjustments
    const lastDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const effectiveTargetDay = Math.min(targetDay, lastDayOfMonth);
    return date.getDate() === effectiveTargetDay;
  }

  // Standard RRule processing
  const rrule = parseRRule(rruleString);
  const occurrences = rrule.between(
    new Date(date.getTime() - 1000), // 1 second before
    new Date(date.getTime() + 1000), // 1 second after
    true,
  );
  return occurrences.length > 0;
}

/**
 * Get all billing dates between two dates
 */
export function getBillingDatesBetween(
  rruleString: string,
  startDate: Date,
  endDate: Date,
): Date[] {
  // For month-end adjustments, generate manually
  const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
  const freqMatch = rruleString.match(/FREQ=(\w+)/);

  if (byMonthDayMatch && freqMatch && freqMatch[1] === "MONTHLY") {
    const targetDay = parseInt(byMonthDayMatch[1]);
    const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
    const dates: Date[] = [];

    let currentYear = startDate.getFullYear();
    let currentMonth = startDate.getMonth();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidateDate = adjustMonthEndDate(
        currentYear,
        currentMonth,
        targetDay,
      );

      if (candidateDate > endDate) break;
      if (candidateDate >= startDate) {
        dates.push(candidateDate);
      }

      // Move to next month by interval
      currentMonth += interval;
      while (currentMonth > 11) {
        currentMonth -= 12;
        currentYear++;
      }
    }

    return dates;
  }

  // Standard RRule processing
  const rrule = parseRRule(rruleString);
  return rrule.between(startDate, endDate, true);
}

/**
 * Create common RRULE strings for billing intervals
 */
export const BillingRules = {
  /**
   * Every month on the same day
   */
  monthly: (dayOfMonth?: number): string => {
    const day = dayOfMonth || new Date().getDate();
    return `FREQ=MONTHLY;BYMONTHDAY=${day}`;
  },

  /**
   * Every year on the same date
   */
  yearly: (month?: number, dayOfMonth?: number): string => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const d = dayOfMonth || now.getDate();
    return `FREQ=YEARLY;BYMONTH=${m};BYMONTHDAY=${d}`;
  },

  /**
   * Every week on the same day
   */
  weekly: (dayOfWeek?: number): string => {
    const day = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
    // Convert JS day (0=Sunday) to RFC 5545 day names
    const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    return `FREQ=WEEKLY;BYDAY=${dayNames[day]}`;
  },

  /**
   * Every N days
   */
  daily: (interval = 1): string => {
    return `FREQ=DAILY;INTERVAL=${interval}`;
  },

  /**
   * Custom interval
   */
  custom: (
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    interval = 1,
  ): string => {
    return `FREQ=${frequency};INTERVAL=${interval}`;
  },

  /**
   * End of month billing (last day of each month)
   */
  endOfMonth: (): string => {
    return "FREQ=MONTHLY;BYMONTHDAY=-1";
  },

  /**
   * Quarterly billing (every 3 months)
   */
  quarterly: (dayOfMonth?: number): string => {
    const day = dayOfMonth || new Date().getDate();
    return `FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${day}`;
  },

  /**
   * Semi-annual billing (every 6 months)
   */
  semiAnnual: (dayOfMonth?: number): string => {
    const day = dayOfMonth || new Date().getDate();
    return `FREQ=MONTHLY;INTERVAL=6;BYMONTHDAY=${day}`;
  },
};

/**
 * Validate an RRULE string
 */
export function validateRRule(rruleString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    parseRRule(rruleString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid RRULE",
    };
  }
}

/**
 * Convert simple interval to RRULE
 */
export function intervalToRRule(
  interval: "DAY" | "WEEK" | "MONTH" | "YEAR",
  intervalCount = 1,
  startDate?: Date,
): string {
  const freq =
    interval === "DAY"
      ? "DAILY"
      : interval === "WEEK"
        ? "WEEKLY"
        : interval === "MONTH"
          ? "MONTHLY"
          : "YEARLY";

  let rrule = `FREQ=${freq}`;

  if (intervalCount > 1) {
    rrule += `;INTERVAL=${intervalCount}`;
  }

  // Add specific day constraints for weekly/monthly/yearly
  if (startDate) {
    switch (interval) {
      case "WEEK": {
        const dayOfWeek = startDate.getDay();
        const rruleDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        const dayNames = ["", "MO", "TU", "WE", "TH", "FR", "SA", "SU"];
        rrule += `;BYDAY=${dayNames[rruleDay]}`;
        break;
      }
      case "MONTH": {
        rrule += `;BYMONTHDAY=${startDate.getDate()}`;
        break;
      }
      case "YEAR": {
        rrule += `;BYMONTH=${startDate.getMonth() + 1};BYMONTHDAY=${startDate.getDate()}`;
        break;
      }
    }
  }

  return rrule;
}
