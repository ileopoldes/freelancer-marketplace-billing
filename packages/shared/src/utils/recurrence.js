"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingRules = void 0;
exports.parseRRule = parseRRule;
exports.getNextBillingDates = getNextBillingDates;
exports.getNextBillingDate = getNextBillingDate;
exports.dateMatchesRecurrence = dateMatchesRecurrence;
exports.getBillingDatesBetween = getBillingDatesBetween;
exports.validateRRule = validateRRule;
exports.intervalToRRule = intervalToRRule;
const rrule_1 = require("rrule");
/**
 * Parse an RFC 5545 RRULE string into an RRule object
 */
function parseRRule(rruleString) {
    try {
        return (0, rrule_1.rrulestr)(rruleString);
    }
    catch (error) {
        throw new Error(`Invalid RRULE: ${rruleString}`);
    }
}
/**
 * Adjust month-end dates when the target day doesn't exist in the month
 */
function adjustMonthEndDate(year, month, targetDay) {
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
/**
 * Generate dates with month-end adjustment for BYMONTHDAY rules
 */
function generateMonthlyDatesWithAdjustment(rruleString, startDate, count) {
    const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
    const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
    const freqMatch = rruleString.match(/FREQ=(\w+)/);
    // Handle non-monthly patterns (weekly, yearly) or complex patterns without BYMONTHDAY
    if (!byMonthDayMatch || (freqMatch && freqMatch[1] !== 'MONTHLY')) {
        // Use standard RRule processing for non-monthly patterns or complex rules
        // For timezone consistency, normalize the start date
        let normalizedStartDate = startDate;
        if (freqMatch && freqMatch[1] === 'WEEKLY') {
            // For weekly patterns, ensure we start from the correct day in UTC
            normalizedStartDate = new Date(startDate.toISOString().split('T')[0] + 'T12:00:00.000Z');
        }
        const rrule = new rrule_1.RRule({
            ...parseRRule(rruleString).options,
            dtstart: normalizedStartDate,
        });
        // For yearly Feb 29 patterns, need special handling
        if (freqMatch && freqMatch[1] === 'YEARLY' && rruleString.includes('BYMONTH=2;BYMONTHDAY=29')) {
            const dates = [];
            let year = startDate.getFullYear();
            while (dates.length < count) {
                // Check if it's a leap year
                if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
                    dates.push(new Date(year, 1, 29)); // February 29
                }
                year++;
            }
            return dates;
        }
        return rrule.all((_, i) => i < count);
    }
    const targetDay = parseInt(byMonthDayMatch[1]);
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
    const dates = [];
    let currentYear = startDate.getFullYear();
    let currentMonth = startDate.getMonth();
    for (let i = 0; i < count; i++) {
        dates.push(adjustMonthEndDate(currentYear, currentMonth, targetDay));
        // Move to next month by interval
        currentMonth += interval;
        while (currentMonth > 11) {
            currentMonth -= 12;
            currentYear++;
        }
    }
    return dates;
}
/**
 * Generate the next billing dates for a subscription
 */
function getNextBillingDates(rruleString, startDate, count = 12) {
    return generateMonthlyDatesWithAdjustment(rruleString, startDate, count);
}
/**
 * Get the next single billing date
 */
function getNextBillingDate(rruleString, after) {
    const afterDate = after || new Date();
    // Check if there's a COUNT limit - need to handle with proper dtstart
    const countMatch = rruleString.match(/COUNT=(\d+)/);
    if (countMatch) {
        // For COUNT rules, we need to use standard RRule with proper dtstart
        // Default to a reasonable start date if not specified
        const startDate = new Date(2024, 0, 1); // Jan 1, 2024
        const rrule = new rrule_1.RRule({
            ...parseRRule(rruleString).options,
            dtstart: startDate,
        });
        const result = rrule.after(afterDate, true);
        return result || null;
    }
    // For month-end adjustments, we need custom logic
    const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
    const freqMatch = rruleString.match(/FREQ=(\w+)/);
    if (byMonthDayMatch && freqMatch && freqMatch[1] === 'MONTHLY') {
        const targetDay = parseInt(byMonthDayMatch[1]);
        const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
        let nextMonth = afterDate.getMonth() + interval;
        let nextYear = afterDate.getFullYear();
        while (nextMonth > 11) {
            nextMonth -= 12;
            nextYear++;
        }
        const nextDate = adjustMonthEndDate(nextYear, nextMonth, targetDay);
        // If the generated date is still before 'after', try next interval
        if (nextDate <= afterDate) {
            nextMonth += interval;
            while (nextMonth > 11) {
                nextMonth -= 12;
                nextYear++;
            }
            return adjustMonthEndDate(nextYear, nextMonth, targetDay);
        }
        return nextDate;
    }
    // Standard RRule processing
    const rrule = parseRRule(rruleString);
    return rrule.after(afterDate, true) || null;
}
/**
 * Check if a date matches the recurrence rule
 */
function dateMatchesRecurrence(rruleString, date) {
    // For month-end adjustments, check manually
    const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
    const freqMatch = rruleString.match(/FREQ=(\w+)/);
    if (byMonthDayMatch && freqMatch && freqMatch[1] === 'MONTHLY') {
        const targetDay = parseInt(byMonthDayMatch[1]);
        // For negative days (from end of month)
        if (targetDay <= 0) {
            const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const actualTargetDay = lastDayOfMonth + targetDay + 1; // -1 means last day
            return date.getDate() === actualTargetDay;
        }
        // For positive days, handle month-end adjustments
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const effectiveTargetDay = Math.min(targetDay, lastDayOfMonth);
        return date.getDate() === effectiveTargetDay;
    }
    // Standard RRule processing
    const rrule = parseRRule(rruleString);
    const occurrences = rrule.between(new Date(date.getTime() - 1000), // 1 second before
    new Date(date.getTime() + 1000), // 1 second after
    true);
    return occurrences.length > 0;
}
/**
 * Get all billing dates between two dates
 */
function getBillingDatesBetween(rruleString, startDate, endDate) {
    // For month-end adjustments, generate manually
    const byMonthDayMatch = rruleString.match(/BYMONTHDAY=(-?\d+)/);
    const freqMatch = rruleString.match(/FREQ=(\w+)/);
    if (byMonthDayMatch && freqMatch && freqMatch[1] === 'MONTHLY') {
        const targetDay = parseInt(byMonthDayMatch[1]);
        const intervalMatch = rruleString.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
        const dates = [];
        let currentYear = startDate.getFullYear();
        let currentMonth = startDate.getMonth();
        while (true) {
            const candidateDate = adjustMonthEndDate(currentYear, currentMonth, targetDay);
            if (candidateDate > endDate)
                break;
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
exports.BillingRules = {
    /**
     * Every month on the same day
     */
    monthly: (dayOfMonth) => {
        const day = dayOfMonth || new Date().getDate();
        return `FREQ=MONTHLY;BYMONTHDAY=${day}`;
    },
    /**
     * Every year on the same date
     */
    yearly: (month, dayOfMonth) => {
        const now = new Date();
        const m = month || now.getMonth() + 1;
        const d = dayOfMonth || now.getDate();
        return `FREQ=YEARLY;BYMONTH=${m};BYMONTHDAY=${d}`;
    },
    /**
     * Every week on the same day
     */
    weekly: (dayOfWeek) => {
        const day = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
        // Convert JS day (0=Sunday) to RFC 5545 day names
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return `FREQ=WEEKLY;BYDAY=${dayNames[day]}`;
    },
    /**
     * Every N days
     */
    daily: (interval = 1) => {
        return `FREQ=DAILY;INTERVAL=${interval}`;
    },
    /**
     * Custom interval
     */
    custom: (frequency, interval = 1) => {
        return `FREQ=${frequency};INTERVAL=${interval}`;
    },
    /**
     * End of month billing (last day of each month)
     */
    endOfMonth: () => {
        return 'FREQ=MONTHLY;BYMONTHDAY=-1';
    },
    /**
     * Quarterly billing (every 3 months)
     */
    quarterly: (dayOfMonth) => {
        const day = dayOfMonth || new Date().getDate();
        return `FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${day}`;
    },
    /**
     * Semi-annual billing (every 6 months)
     */
    semiAnnual: (dayOfMonth) => {
        const day = dayOfMonth || new Date().getDate();
        return `FREQ=MONTHLY;INTERVAL=6;BYMONTHDAY=${day}`;
    },
};
/**
 * Validate an RRULE string
 */
function validateRRule(rruleString) {
    try {
        parseRRule(rruleString);
        return { valid: true };
    }
    catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Invalid RRULE',
        };
    }
}
/**
 * Convert simple interval to RRULE
 */
function intervalToRRule(interval, intervalCount = 1, startDate) {
    const freq = interval === 'DAY' ? 'DAILY' :
        interval === 'WEEK' ? 'WEEKLY' :
            interval === 'MONTH' ? 'MONTHLY' :
                'YEARLY';
    let rrule = `FREQ=${freq}`;
    if (intervalCount > 1) {
        rrule += `;INTERVAL=${intervalCount}`;
    }
    // Add specific day constraints for weekly/monthly/yearly
    if (startDate) {
        switch (interval) {
            case 'WEEK':
                const dayOfWeek = startDate.getDay();
                const rruleDay = dayOfWeek === 0 ? 7 : dayOfWeek;
                const dayNames = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
                rrule += `;BYDAY=${dayNames[rruleDay]}`;
                break;
            case 'MONTH':
                rrule += `;BYMONTHDAY=${startDate.getDate()}`;
                break;
            case 'YEAR':
                rrule += `;BYMONTH=${startDate.getMonth() + 1};BYMONTHDAY=${startDate.getDate()}`;
                break;
        }
    }
    return rrule;
}
//# sourceMappingURL=recurrence.js.map