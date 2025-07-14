import { createMoney, addMoney, multiplyMoney, moneyToDecimalString } from '@marketplace/shared';

// We'll create these pricing services
import { FlatFeePricer } from '../src/services/pricing/FlatFeePricer';
import { TieredUsagePricer } from '../src/services/pricing/TieredUsagePricer';
// MinimumCommitPricer removed - using simplified pricing logic
import { ProrationEngine } from '../src/services/pricing/ProrationEngine';

describe('Pricing Engine', () => {
  describe('Flat Fee Pricing', () => {
    let flatFeePricer: FlatFeePricer;

    beforeEach(() => {
      flatFeePricer = new FlatFeePricer();
    });

    test('should calculate full monthly fee', () => {
      const amount = createMoney('99.00');
      const daysInPeriod = 30;
      const daysUsed = 30;
      
      const result = flatFeePricer.calculate(amount, daysInPeriod, daysUsed);
      
      expect(moneyToDecimalString(result)).toBe('99.0000');
    });

    test('should calculate prorated fee for partial month', () => {
      const amount = createMoney('99.00');
      const daysInPeriod = 30;
      const daysUsed = 15; // Half month
      
      const result = flatFeePricer.calculate(amount, daysInPeriod, daysUsed);
      
      expect(moneyToDecimalString(result)).toBe('49.5000');
    });

    test('should handle leap year February', () => {
      const amount = createMoney('99.00');
      const daysInPeriod = 29; // Feb 2024 (leap year)
      const daysUsed = 15;
      
      const result = flatFeePricer.calculate(amount, daysInPeriod, daysUsed);
      const expected = 99 * (15 / 29);
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should handle single day proration', () => {
      const amount = createMoney('99.00');
      const daysInPeriod = 31;
      const daysUsed = 1;
      
      const result = flatFeePricer.calculate(amount, daysInPeriod, daysUsed);
      const expected = 99 / 31;
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should maintain precision with large amounts', () => {
      const amount = createMoney('999999.99');
      const daysInPeriod = 365;
      const daysUsed = 1;
      
      const result = flatFeePricer.calculate(amount, daysInPeriod, daysUsed);
      
      expect(moneyToDecimalString(result)).toMatch(/^\d+\.\d{4}$/);
    });
  });

  describe('Tiered Usage Pricing', () => {
    let tieredPricer: TieredUsagePricer;

    beforeEach(() => {
      // Standard tier structure: 1000 free, then $0.002, then $0.001
      tieredPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: 1000000, price: createMoney('0.002') },
        { limit: null, price: createMoney('0.001') }, // Unlimited tier
      ]);
    });

    test('should calculate zero cost for usage within free tier', () => {
      const usage = 500;
      const result = tieredPricer.calculate(usage);
      
      expect(moneyToDecimalString(result)).toBe('0.0000');
    });

    test('should calculate cost for usage exactly at free tier limit', () => {
      const usage = 1000;
      const result = tieredPricer.calculate(usage);
      
      expect(moneyToDecimalString(result)).toBe('0.0000');
    });

    test('should calculate cost for usage in second tier', () => {
      const usage = 1500; // 1000 free + 500 at $0.002
      const result = tieredPricer.calculate(usage);
      const expected = 500 * 0.002;
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should calculate cost spanning multiple tiers', () => {
      const usage = 1500000; // 1000 free + 999000 at $0.002 + 499000 at $0.001
      const result = tieredPricer.calculate(usage);
      
      const tier2Cost = 999000 * 0.002; // $1998
      const tier3Cost = 500000 * 0.001; // $500 (corrected from 499000)
      const expected = tier2Cost + tier3Cost; // $2498
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should handle exact tier boundaries', () => {
      const usage = 1000000; // Exactly at tier 2 limit
      const result = tieredPricer.calculate(usage);
      
      const expected = 999000 * 0.002; // $1998
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should handle massive usage efficiently', () => {
      const usage = 10000000; // 10 million calls
      const result = tieredPricer.calculate(usage);
      
      const tier2Cost = 999000 * 0.002;
      const tier3Cost = 9000000 * 0.001;
      const expected = tier2Cost + tier3Cost;
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should maintain precision with fractional pricing', () => {
      // Test with pricing that creates fractional cents
      const customPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: null, price: createMoney('0.00123') }, // Unusual price
      ]);
      
      const usage = 1001;
      const result = customPricer.calculate(usage);
      const expected = 1 * 0.00123;
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });
  });

  describe('Combined Pricing Logic', () => {
    test('should combine flat fee and tiered usage pricing', () => {
      // Business logic: Base fee + tiered usage pricing
      const baseFee = createMoney('99.00');
      const usage = 15000;
      
      const flatFeePricer = new FlatFeePricer();
      const flatFee = flatFeePricer.calculate(baseFee, 30, 30); // Full month
      
      const tieredPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: 1000000, price: createMoney('0.002') },
        { limit: null, price: createMoney('0.001') },
      ]);
      
      const usageResult = tieredPricer.calculate(usage);
      const total = addMoney(flatFee, usageResult);
      
      expect(moneyToDecimalString(flatFee)).toBe('99.0000');
      expect(moneyToDecimalString(usageResult)).toBe('28.0000'); // (15000-1000) * 0.002
      expect(moneyToDecimalString(total)).toBe('127.0000');
    });

    test('should handle complex scenario with all pricing components', () => {
      // Complex scenario: Customer with multiple pricing components
      const baseFee = createMoney('99.00');
      const usage = 2500000; // 2.5M calls
      
      // 1. Flat fee (prorated for 15 days of 30-day month)
      const flatFeePricer = new FlatFeePricer();
      const flatFee = flatFeePricer.calculate(baseFee, 30, 15);
      
      // 2. Tiered usage pricing
      const tieredPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: 1000000, price: createMoney('0.002') },
        { limit: null, price: createMoney('0.001') },
      ]);
      
      const usageResult = tieredPricer.calculate(usage);
      
      // 3. Total calculation
      const total = addMoney(flatFee, usageResult);
      
      expect(moneyToDecimalString(flatFee)).toBe('49.5000'); // Half month
      expect(moneyToDecimalString(usageResult)).toBe('3498.0000'); // Tiered calculation
      expect(moneyToDecimalString(total)).toBe('3547.5000');
    });
  });

  describe('Proration Engine', () => {
    let prorationEngine: ProrationEngine;

    beforeEach(() => {
      prorationEngine = new ProrationEngine();
    });

    test('should calculate daily proration rate', () => {
      const amount = createMoney('99.00');
      const totalDays = 30;
      const usedDays = 15;
      
      const result = prorationEngine.calculateDailyProration(amount, totalDays, usedDays);
      
      expect(moneyToDecimalString(result)).toBe('49.5000');
    });

    test('should handle mid-cycle upgrade scenario', () => {
      // Customer upgrades from $99 to $199 plan on day 15 of 30-day month
      const oldPlan = createMoney('99.00');
      const newPlan = createMoney('199.00');
      const totalDays = 30;
      const upgradeDay = 15;
      
      const oldPlanCharge = prorationEngine.calculateDailyProration(
        oldPlan, 
        totalDays, 
        upgradeDay - 1 // 14 days
      );
      
      const newPlanCharge = prorationEngine.calculateDailyProration(
        newPlan, 
        totalDays, 
        totalDays - (upgradeDay - 1) // 16 days
      );
      
      const total = addMoney(oldPlanCharge, newPlanCharge);
      
      expect(moneyToDecimalString(oldPlanCharge)).toBe('46.2000'); // $99 * 14/30
      expect(moneyToDecimalString(newPlanCharge)).toBe('106.1333'); // $199 * 16/30
      expect(moneyToDecimalString(total)).toBe('152.3333');
    });

    test('should handle leap year calculations', () => {
      const amount = createMoney('99.00');
      const leapYearFeb = 29;
      const usedDays = 15;
      
      const result = prorationEngine.calculateDailyProration(amount, leapYearFeb, usedDays);
      const expected = 99 * (15 / 29);
      
      expect(moneyToDecimalString(result)).toBe(expected.toFixed(4));
    });

    test('should maintain precision across multiple prorations', () => {
      const amount = createMoney('999.99');
      const totalDays = 365;
      
      // Calculate daily rate and multiply back
      const dailyRate = prorationEngine.calculateDailyProration(amount, totalDays, 1);
      const reconstructed = multiplyMoney(dailyRate, 365);
      
      // Should be very close to original (within rounding precision)
      const difference = Math.abs(
        parseFloat(moneyToDecimalString(amount)) - 
        parseFloat(moneyToDecimalString(reconstructed))
      );
      
      expect(difference).toBeLessThan(0.01); // Within 1 cent
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle zero amounts gracefully', () => {
      const flatFeePricer = new FlatFeePricer();
      const result = flatFeePricer.calculate(createMoney('0'), 30, 15);
      
      expect(moneyToDecimalString(result)).toBe('0.0000');
    });

    test('should handle zero usage gracefully', () => {
      const tieredPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: null, price: createMoney('0.002') },
      ]);
      
      const result = tieredPricer.calculate(0);
      expect(moneyToDecimalString(result)).toBe('0.0000');
    });

    test('should throw error for invalid proration parameters', () => {
      const prorationEngine = new ProrationEngine();
      
      expect(() => {
        prorationEngine.calculateDailyProration(createMoney('99'), 0, 15);
      }).toThrow('Total days must be greater than zero');
      
      expect(() => {
        prorationEngine.calculateDailyProration(createMoney('99'), 30, -1);
      }).toThrow('Used days cannot be negative');
      
      expect(() => {
        prorationEngine.calculateDailyProration(createMoney('99'), 30, 31);
      }).toThrow('Used days cannot exceed total days');
    });

    test('should handle very large usage numbers', () => {
      const tieredPricer = new TieredUsagePricer([
        { limit: 1000, price: createMoney('0') },
        { limit: null, price: createMoney('0.001') },
      ]);
      
      const massiveUsage = 100000000; // 100 million calls
      const result = tieredPricer.calculate(massiveUsage);
      
      // Should not overflow or lose precision
      expect(moneyToDecimalString(result)).toMatch(/^\d+\.\d{4}$/);
      expect(parseFloat(moneyToDecimalString(result))).toBeGreaterThan(0);
    });
  });
});

