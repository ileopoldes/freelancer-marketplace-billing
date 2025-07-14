import Decimal from 'decimal.js';
import { Money } from '../types';

// Configure Decimal.js for financial precision
Decimal.config({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_HALF_UP,
  crypto: false,
});

/**
 * Create a Money object from a string or number
 */
export function createMoney(amount: string | number, currency = 'USD'): Money {
  return {
    amount: new Decimal(amount),
    currency: currency.toUpperCase(),
  };
}

/**
 * Add two Money objects (must have same currency)
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} and ${b.currency}`);
  }
  
  return {
    amount: a.amount.add(b.amount),
    currency: a.currency,
  };
}

/**
 * Subtract two Money objects (must have same currency)
 */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract different currencies: ${a.currency} and ${b.currency}`);
  }
  
  return {
    amount: a.amount.sub(b.amount),
    currency: a.currency,
  };
}

/**
 * Multiply Money by a number
 */
export function multiplyMoney(money: Money, multiplier: string | number): Money {
  return {
    amount: money.amount.mul(new Decimal(multiplier)),
    currency: money.currency,
  };
}

/**
 * Divide Money by a number
 */
export function divideMoney(money: Money, divisor: string | number): Money {
  return {
    amount: money.amount.div(new Decimal(divisor)),
    currency: money.currency,
  };
}

/**
 * Round Money to specified decimal places (default 2 for most currencies)
 */
export function roundMoney(money: Money, decimalPlaces = 2): Money {
  return {
    amount: money.amount.toDecimalPlaces(decimalPlaces),
    currency: money.currency,
  };
}

/**
 * Compare two Money objects
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
export function compareMoney(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot compare different currencies: ${a.currency} and ${b.currency}`);
  }
  
  return a.amount.comparedTo(b.amount);
}

/**
 * Check if Money is zero
 */
export function isZeroMoney(money: Money): boolean {
  return money.amount.isZero();
}

/**
 * Check if Money is positive
 */
export function isPositiveMoney(money: Money): boolean {
  return money.amount.isPositive();
}

/**
 * Check if Money is negative
 */
export function isNegativeMoney(money: Money): boolean {
  return money.amount.isNegative();
}

/**
 * Format Money for display
 */
export function formatMoney(money: Money, locale = 'en-US'): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  
  return formatter.format(money.amount.toNumber());
}

/**
 * Convert Money to database decimal string
 */
export function moneyToDecimalString(money: Money): string {
  return money.amount.toFixed(4);
}

/**
 * Create Money from database decimal string
 */
export function moneyFromDecimalString(decimalString: string, currency = 'USD'): Money {
  return {
    amount: new Decimal(decimalString),
    currency: currency.toUpperCase(),
  };
}

/**
 * Calculate percentage of Money
 */
export function calculatePercentage(money: Money, percentage: string | number): Money {
  const percent = new Decimal(percentage).div(100);
  return {
    amount: money.amount.mul(percent),
    currency: money.currency,
  };
}

/**
 * Sum an array of Money objects (all must have same currency)
 */
export function sumMoney(moneyArray: Money[]): Money {
  if (moneyArray.length === 0) {
    return createMoney(0);
  }
  
  const currency = moneyArray[0].currency;
  const sum = moneyArray.reduce((acc, money) => {
    if (money.currency !== currency) {
      throw new Error(`Cannot sum different currencies: ${currency} and ${money.currency}`);
    }
    return acc.add(money.amount);
  }, new Decimal(0));
  
  return {
    amount: sum,
    currency,
  };
}

