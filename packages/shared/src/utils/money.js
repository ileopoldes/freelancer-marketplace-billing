"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoney = createMoney;
exports.addMoney = addMoney;
exports.subtractMoney = subtractMoney;
exports.multiplyMoney = multiplyMoney;
exports.divideMoney = divideMoney;
exports.roundMoney = roundMoney;
exports.compareMoney = compareMoney;
exports.isZeroMoney = isZeroMoney;
exports.isPositiveMoney = isPositiveMoney;
exports.isNegativeMoney = isNegativeMoney;
exports.formatMoney = formatMoney;
exports.moneyToDecimalString = moneyToDecimalString;
exports.moneyFromDecimalString = moneyFromDecimalString;
exports.calculatePercentage = calculatePercentage;
exports.sumMoney = sumMoney;
const decimal_js_1 = __importDefault(require("decimal.js"));
// Configure Decimal.js for financial precision
decimal_js_1.default.config({
  precision: 28,
  rounding: decimal_js_1.default.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: decimal_js_1.default.ROUND_HALF_UP,
  crypto: false,
});
/**
 * Create a Money object from a string or number
 */
function createMoney(amount, currency = "USD") {
  return {
    amount: new decimal_js_1.default(amount),
    currency: currency.toUpperCase(),
  };
}
/**
 * Add two Money objects (must have same currency)
 */
function addMoney(a, b) {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amount: a.amount.add(b.amount),
    currency: a.currency,
  };
}
/**
 * Subtract two Money objects (must have same currency)
 */
function subtractMoney(a, b) {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot subtract different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amount: a.amount.sub(b.amount),
    currency: a.currency,
  };
}
/**
 * Multiply Money by a number
 */
function multiplyMoney(money, multiplier) {
  return {
    amount: money.amount.mul(new decimal_js_1.default(multiplier)),
    currency: money.currency,
  };
}
/**
 * Divide Money by a number
 */
function divideMoney(money, divisor) {
  return {
    amount: money.amount.div(new decimal_js_1.default(divisor)),
    currency: money.currency,
  };
}
/**
 * Round Money to specified decimal places (default 2 for most currencies)
 */
function roundMoney(money, decimalPlaces = 2) {
  return {
    amount: money.amount.toDecimalPlaces(decimalPlaces),
    currency: money.currency,
  };
}
/**
 * Compare two Money objects
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
function compareMoney(a, b) {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot compare different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return a.amount.comparedTo(b.amount);
}
/**
 * Check if Money is zero
 */
function isZeroMoney(money) {
  return money.amount.isZero();
}
/**
 * Check if Money is positive
 */
function isPositiveMoney(money) {
  return money.amount.isPositive();
}
/**
 * Check if Money is negative
 */
function isNegativeMoney(money) {
  return money.amount.isNegative();
}
/**
 * Format Money for display
 */
function formatMoney(money, locale = "en-US") {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return formatter.format(money.amount.toNumber());
}
/**
 * Convert Money to database decimal string
 */
function moneyToDecimalString(money) {
  return money.amount.toFixed(4);
}
/**
 * Create Money from database decimal string
 */
function moneyFromDecimalString(decimalString, currency = "USD") {
  return {
    amount: new decimal_js_1.default(decimalString),
    currency: currency.toUpperCase(),
  };
}
/**
 * Calculate percentage of Money
 */
function calculatePercentage(money, percentage) {
  const percent = new decimal_js_1.default(percentage).div(100);
  return {
    amount: money.amount.mul(percent),
    currency: money.currency,
  };
}
/**
 * Sum an array of Money objects (all must have same currency)
 */
function sumMoney(moneyArray) {
  if (moneyArray.length === 0) {
    return createMoney(0);
  }
  const currency = moneyArray[0].currency;
  const sum = moneyArray.reduce((acc, money) => {
    if (money.currency !== currency) {
      throw new Error(
        `Cannot sum different currencies: ${currency} and ${money.currency}`,
      );
    }
    return acc.add(money.amount);
  }, new decimal_js_1.default(0));
  return {
    amount: sum,
    currency,
  };
}
//# sourceMappingURL=money.js.map
