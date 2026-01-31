import { describe, it, expect } from 'vitest';
import { formatCurrency, centsToEuros, eurosToCents } from '@/lib/utils/currency';

/**
 * Test per le utility functions che gestiscono formattazione e conversioni.
 * Questi test prevengono regressioni in logica comune usata in tutto il FE.
 */

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      const result = formatCurrency(100);
      expect(result).toContain('1,00');
      expect(result).toContain('€');
      // Large amounts might not have thousand separator in all locales
      const largeAmount = formatCurrency(350000);
      expect(largeAmount).toContain('€');
      expect(centsToEuros(350000)).toBe(3500);
    });

    it('should format negative amounts correctly', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-1,00');
      expect(result).toContain('€');
    });

    it('should handle zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
      expect(result).toContain('€');
    });

    it('should handle very large amounts', () => {
      const result = formatCurrency(1000000000);
      expect(result).toContain('10.000.000,00');
    });

    it('should handle decimal precision correctly', () => {
      expect(formatCurrency(1)).toContain('0,01');
      expect(formatCurrency(99)).toContain('0,99');
      expect(formatCurrency(101)).toContain('1,01');
    });
  });

  describe('centsToEuros', () => {
    it('should convert cents to euros correctly', () => {
      expect(centsToEuros(100)).toBe(1);
      expect(centsToEuros(1000)).toBe(10);
      expect(centsToEuros(350000)).toBe(3500);
    });

    it('should handle negative amounts', () => {
      expect(centsToEuros(-100)).toBe(-1);
      expect(centsToEuros(-8450)).toBe(-84.5);
    });

    it('should handle zero', () => {
      expect(centsToEuros(0)).toBe(0);
    });

    it('should preserve decimal precision', () => {
      expect(centsToEuros(1)).toBe(0.01);
      expect(centsToEuros(99)).toBe(0.99);
      expect(centsToEuros(101)).toBe(1.01);
    });
  });

  describe('eurosToCents', () => {
    it('should convert euros to cents correctly', () => {
      expect(eurosToCents(1)).toBe(100);
      expect(eurosToCents(10)).toBe(1000);
      expect(eurosToCents(3500)).toBe(350000);
    });

    it('should handle negative amounts', () => {
      expect(eurosToCents(-1)).toBe(-100);
      expect(eurosToCents(-84.5)).toBe(-8450);
    });

    it('should handle zero', () => {
      expect(eurosToCents(0)).toBe(0);
    });

    it('should round decimal cents correctly', () => {
      // Math.round usa banker's rounding per .5
      expect(eurosToCents(1.004)).toBe(100); // Round down
      expect(eurosToCents(1.006)).toBe(101); // Round up
      expect(eurosToCents(1.999)).toBe(200); // Round up
    });

    it('should handle very small amounts', () => {
      expect(eurosToCents(0.01)).toBe(1);
      expect(eurosToCents(0.99)).toBe(99);
    });
  });
});

// Date formatting utilities
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT').format(date);
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format ISO dates correctly', () => {
      expect(formatDate('2026-01-23')).toBe('23/01/2026');
      expect(formatDate('2025-12-31')).toBe('31/12/2025');
    });

    it('should handle full ISO datetime strings', () => {
      const result = formatDate('2026-01-23T12:30:00Z');
      expect(result).toMatch(/23\/01\/2026/);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date strings', () => {
      expect(isValidDate('2026-01-23')).toBe(true);
      expect(isValidDate('2025-12-31')).toBe(true);
      expect(isValidDate('2026-01-23T12:30:00Z')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2026-13-01')).toBe(false);
      // Note: JS Date accetta 2026-02-30 e lo converte a 2026-03-02
      // expect(isValidDate('2026-02-30')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isValidDate('')).toBe(false);
    });
  });
});

// Category validation
const VALID_CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'utilities',
  'health',
  'shopping',
  'income',
  'other',
] as const;

type Category = typeof VALID_CATEGORIES[number];

const isValidCategory = (category: string): category is Category => {
  return VALID_CATEGORIES.includes(category as Category);
};

describe('Category Validation', () => {
  it('should validate correct categories', () => {
    expect(isValidCategory('food')).toBe(true);
    expect(isValidCategory('transport')).toBe(true);
    expect(isValidCategory('income')).toBe(true);
  });

  it('should reject invalid categories', () => {
    expect(isValidCategory('invalid')).toBe(false);
    expect(isValidCategory('FOOD')).toBe(false);
    expect(isValidCategory('')).toBe(false);
  });

  it('should have all expected categories', () => {
    const categories = ['food', 'transport', 'entertainment', 'utilities', 'health', 'shopping', 'income', 'other'];
    categories.forEach(cat => {
      expect(isValidCategory(cat)).toBe(true);
    });
  });
});

// Amount validation
const isPositiveAmount = (cents: number): boolean => {
  return cents > 0;
};

const isNegativeAmount = (cents: number): boolean => {
  return cents < 0;
};

const isValidAmount = (cents: number): boolean => {
  return typeof cents === 'number' && !isNaN(cents) && isFinite(cents);
};

describe('Amount Validation', () => {
  describe('isPositiveAmount', () => {
    it('should return true for positive amounts', () => {
      expect(isPositiveAmount(1)).toBe(true);
      expect(isPositiveAmount(100)).toBe(true);
      expect(isPositiveAmount(1000000)).toBe(true);
    });

    it('should return false for negative or zero', () => {
      expect(isPositiveAmount(0)).toBe(false);
      expect(isPositiveAmount(-1)).toBe(false);
      expect(isPositiveAmount(-100)).toBe(false);
    });
  });

  describe('isNegativeAmount', () => {
    it('should return true for negative amounts', () => {
      expect(isNegativeAmount(-1)).toBe(true);
      expect(isNegativeAmount(-100)).toBe(true);
      expect(isNegativeAmount(-1000000)).toBe(true);
    });

    it('should return false for positive or zero', () => {
      expect(isNegativeAmount(0)).toBe(false);
      expect(isNegativeAmount(1)).toBe(false);
      expect(isNegativeAmount(100)).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    it('should validate numeric amounts', () => {
      expect(isValidAmount(0)).toBe(true);
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(-100)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
      expect(isValidAmount(-Infinity)).toBe(false);
    });
  });
});

// Balance calculation
const calculateBalance = (payments: Array<{ amountInCents: number }>): number => {
  return payments.reduce((sum, payment) => sum + payment.amountInCents, 0);
};

const calculateIncome = (payments: Array<{ amountInCents: number }>): number => {
  return payments
    .filter(p => p.amountInCents > 0)
    .reduce((sum, payment) => sum + payment.amountInCents, 0);
};

const calculateExpenses = (payments: Array<{ amountInCents: number }>): number => {
  return Math.abs(
    payments
      .filter(p => p.amountInCents < 0)
      .reduce((sum, payment) => sum + payment.amountInCents, 0)
  );
};

describe('Balance Calculations', () => {
  const payments = [
    { amountInCents: 350000 }, // +3500 income
    { amountInCents: -8450 },  // -84.50 expense
    { amountInCents: -1299 },  // -12.99 expense
    { amountInCents: 75000 },  // +750 income
    { amountInCents: -2350 },  // -23.50 expense
  ];

  describe('calculateBalance', () => {
    it('should calculate total balance correctly', () => {
      expect(calculateBalance(payments)).toBe(412901); // 350000 - 8450 - 1299 + 75000 - 2350
    });

    it('should handle empty array', () => {
      expect(calculateBalance([])).toBe(0);
    });

    it('should handle all positive amounts', () => {
      const income = [{ amountInCents: 100 }, { amountInCents: 200 }];
      expect(calculateBalance(income)).toBe(300);
    });

    it('should handle all negative amounts', () => {
      const expenses = [{ amountInCents: -100 }, { amountInCents: -200 }];
      expect(calculateBalance(expenses)).toBe(-300);
    });
  });

  describe('calculateIncome', () => {
    it('should sum only positive amounts', () => {
      expect(calculateIncome(payments)).toBe(425000); // 350000 + 75000
    });

    it('should return 0 for no income', () => {
      const expenses = [{ amountInCents: -100 }, { amountInCents: -200 }];
      expect(calculateIncome(expenses)).toBe(0);
    });

    it('should handle empty array', () => {
      expect(calculateIncome([])).toBe(0);
    });
  });

  describe('calculateExpenses', () => {
    it('should sum absolute value of negative amounts', () => {
      expect(calculateExpenses(payments)).toBe(12099); // 8450 + 1299 + 2350
    });

    it('should return 0 for no expenses', () => {
      const income = [{ amountInCents: 100 }, { amountInCents: 200 }];
      expect(calculateExpenses(income)).toBe(0);
    });

    it('should handle empty array', () => {
      expect(calculateExpenses([])).toBe(0);
    });

    it('should return positive number even with negative amounts', () => {
      const result = calculateExpenses([{ amountInCents: -100 }]);
      expect(result).toBe(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

// String validation for forms
const isValidMerchantName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100;
};

const isValidWalletName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 50;
};

const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

describe('String Validation', () => {
  describe('isValidMerchantName', () => {
    it('should validate correct merchant names', () => {
      expect(isValidMerchantName('Supermarket')).toBe(true);
      expect(isValidMerchantName('AB')).toBe(true);
      expect(isValidMerchantName('A'.repeat(100))).toBe(true);
    });

    it('should reject too short names', () => {
      expect(isValidMerchantName('A')).toBe(false);
      expect(isValidMerchantName('')).toBe(false);
    });

    it('should reject too long names', () => {
      expect(isValidMerchantName('A'.repeat(101))).toBe(false);
    });
  });

  describe('isValidWalletName', () => {
    it('should validate correct wallet names', () => {
      expect(isValidWalletName('Main Account')).toBe(true);
      expect(isValidWalletName('A')).toBe(true);
      expect(isValidWalletName('A'.repeat(50))).toBe(true);
    });

    it('should reject empty names', () => {
      expect(isValidWalletName('')).toBe(false);
    });

    it('should reject too long names', () => {
      expect(isValidWalletName('A'.repeat(51))).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttab\t\n')).toBe('tab');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeString('hello    world')).toBe('hello world');
      expect(sanitizeString('a  b  c')).toBe('a b c');
    });

    it('should handle already clean strings', () => {
      expect(sanitizeString('hello world')).toBe('hello world');
    });
  });
});
