import { Money } from '../types';
/**
 * Create a Money object from a string or number
 */
export declare function createMoney(amount: string | number, currency?: string): Money;
/**
 * Add two Money objects (must have same currency)
 */
export declare function addMoney(a: Money, b: Money): Money;
/**
 * Subtract two Money objects (must have same currency)
 */
export declare function subtractMoney(a: Money, b: Money): Money;
/**
 * Multiply Money by a number
 */
export declare function multiplyMoney(money: Money, multiplier: string | number): Money;
/**
 * Divide Money by a number
 */
export declare function divideMoney(money: Money, divisor: string | number): Money;
/**
 * Round Money to specified decimal places (default 2 for most currencies)
 */
export declare function roundMoney(money: Money, decimalPlaces?: number): Money;
/**
 * Compare two Money objects
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
export declare function compareMoney(a: Money, b: Money): number;
/**
 * Check if Money is zero
 */
export declare function isZeroMoney(money: Money): boolean;
/**
 * Check if Money is positive
 */
export declare function isPositiveMoney(money: Money): boolean;
/**
 * Check if Money is negative
 */
export declare function isNegativeMoney(money: Money): boolean;
/**
 * Format Money for display
 */
export declare function formatMoney(money: Money, locale?: string): string;
/**
 * Convert Money to database decimal string
 */
export declare function moneyToDecimalString(money: Money): string;
/**
 * Create Money from database decimal string
 */
export declare function moneyFromDecimalString(decimalString: string, currency?: string): Money;
/**
 * Calculate percentage of Money
 */
export declare function calculatePercentage(money: Money, percentage: string | number): Money;
/**
 * Sum an array of Money objects (all must have same currency)
 */
export declare function sumMoney(moneyArray: Money[]): Money;
//# sourceMappingURL=money.d.ts.map