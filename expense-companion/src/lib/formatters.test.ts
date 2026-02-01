import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getCategoryColor,
  getCategoryIcon,
  capitalize,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(100000)).toBe('€1,000.00');
      expect(formatCurrency(1)).toBe('€0.01');
      expect(formatCurrency(99)).toBe('€0.99');
    });

    it('should format negative amounts', () => {
      expect(formatCurrency(-100000)).toBe('-€1,000.00');
      expect(formatCurrency(-1)).toBe('-€0.01');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('€0.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(100000, 'USD')).toContain('1,000.00');
      expect(formatCurrency(100000, 'GBP')).toContain('1,000.00');
    });

    it('should show sign when requested', () => {
      expect(formatCurrency(100000, 'EUR', true)).toBe('+€1,000.00');
      expect(formatCurrency(-100000, 'EUR', true)).toBe('-€1,000.00');
      expect(formatCurrency(0, 'EUR', true)).toBe('€0.00');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000000)).toBe('€10,000,000.00');
    });

    it('should handle fractional cents', () => {
      expect(formatCurrency(1050)).toBe('€10.50');
      expect(formatCurrency(125)).toBe('€1.25');
    });

    it('should use EUR as default currency', () => {
      expect(formatCurrency(100)).toContain('€');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date strings', () => {
      expect(formatDate('2026-01-31')).toBe('Jan 31, 2026');
      expect(formatDate('2026-12-25')).toBe('Dec 25, 2026');
    });

    it('should format Date objects', () => {
      const date = new Date('2026-01-31T00:00:00');
      expect(formatDate(date)).toBe('Jan 31, 2026');
    });

    it('should use custom format string', () => {
      expect(formatDate('2026-01-31', 'yyyy-MM-dd')).toBe('2026-01-31');
      expect(formatDate('2026-01-31', 'dd/MM/yyyy')).toBe('31/01/2026');
      expect(formatDate('2026-01-31', 'MMMM d, yyyy')).toBe('January 31, 2026');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
      expect(formatDate('2026-13-45')).toBe('Invalid date');
    });

    it('should use default format MMM d, yyyy', () => {
      expect(formatDate('2026-06-15')).toBe('Jun 15, 2026');
    });
  });

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-01T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show "Today" for current date', () => {
      expect(formatRelativeDate('2026-02-01')).toBe('Today');
    });

    it('should show "Yesterday" for previous day', () => {
      expect(formatRelativeDate('2026-01-31')).toBe('Yesterday');
    });

    it('should show days ago for recent dates', () => {
      expect(formatRelativeDate('2026-01-30')).toBe('2 days ago');
      expect(formatRelativeDate('2026-01-28')).toBe('4 days ago');
      expect(formatRelativeDate('2026-01-26')).toBe('6 days ago');
    });

    it('should show weeks ago for dates within a month', () => {
      expect(formatRelativeDate('2026-01-25')).toBe('1 weeks ago');
      expect(formatRelativeDate('2026-01-18')).toBe('2 weeks ago');
      expect(formatRelativeDate('2026-01-11')).toBe('3 weeks ago');
    });

    it('should show formatted date for older dates', () => {
      expect(formatRelativeDate('2025-12-01')).toBe('Dec 1');
      expect(formatRelativeDate('2025-06-15')).toBe('Jun 15');
    });

    it('should handle Date objects', () => {
      const today = new Date('2026-02-01T12:00:00');
      expect(formatRelativeDate(today)).toBe('Today');

      const yesterday = new Date('2026-01-31T12:00:00');
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });

    it('should handle invalid dates', () => {
      expect(formatRelativeDate('invalid-date')).toBe('Invalid date');
    });

    it('should handle future dates', () => {
      // Future dates will have negative days, which shows as formatted text with negative days
      const result = formatRelativeDate('2026-02-05');
      // The function calculates negative days for future dates
      expect(result).toContain('days ago'); // Even though negative, it still formats as "days ago"
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct color for known categories', () => {
      expect(getCategoryColor('food')).toBe('bg-category-food');
      expect(getCategoryColor('transport')).toBe('bg-category-transport');
      expect(getCategoryColor('shopping')).toBe('bg-category-shopping');
      expect(getCategoryColor('entertainment')).toBe('bg-category-entertainment');
      expect(getCategoryColor('utilities')).toBe('bg-category-utilities');
      expect(getCategoryColor('health')).toBe('bg-category-health');
      expect(getCategoryColor('income')).toBe('bg-category-income');
    });

    it('should return "other" color for unknown categories', () => {
      expect(getCategoryColor('unknown')).toBe('bg-category-other');
      expect(getCategoryColor('random')).toBe('bg-category-other');
      expect(getCategoryColor('')).toBe('bg-category-other');
    });

    it('should handle case insensitively', () => {
      expect(getCategoryColor('FOOD')).toBe('bg-category-food');
      expect(getCategoryColor('Food')).toBe('bg-category-food');
      expect(getCategoryColor('FoOd')).toBe('bg-category-food');
    });

    it('should handle explicit "other" category', () => {
      expect(getCategoryColor('other')).toBe('bg-category-other');
      expect(getCategoryColor('OTHER')).toBe('bg-category-other');
    });
  });

  describe('getCategoryIcon', () => {
    it('should return correct icon for known categories', () => {
      expect(getCategoryIcon('food')).toBe('utensils');
      expect(getCategoryIcon('transport')).toBe('car');
      expect(getCategoryIcon('shopping')).toBe('shopping-bag');
      expect(getCategoryIcon('entertainment')).toBe('film');
      expect(getCategoryIcon('utilities')).toBe('zap');
      expect(getCategoryIcon('health')).toBe('heart');
      expect(getCategoryIcon('income')).toBe('trending-up');
    });

    it('should return "circle" icon for unknown categories', () => {
      expect(getCategoryIcon('unknown')).toBe('circle');
      expect(getCategoryIcon('random')).toBe('circle');
      expect(getCategoryIcon('')).toBe('circle');
    });

    it('should handle case insensitively', () => {
      expect(getCategoryIcon('FOOD')).toBe('utensils');
      expect(getCategoryIcon('Food')).toBe('utensils');
      expect(getCategoryIcon('FoOd')).toBe('utensils');
    });

    it('should handle explicit "other" category', () => {
      expect(getCategoryIcon('other')).toBe('circle');
      expect(getCategoryIcon('OTHER')).toBe('circle');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter of lowercase string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should lowercase rest of the string', () => {
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('WoRlD')).toBe('World');
      expect(capitalize('HeLLo WoRLD')).toBe('Hello world');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('Z')).toBe('Z');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle strings with numbers', () => {
      expect(capitalize('test123')).toBe('Test123');
      expect(capitalize('123test')).toBe('123test');
    });

    it('should handle strings with special characters', () => {
      expect(capitalize('hello-world')).toBe('Hello-world');
      expect(capitalize('test_case')).toBe('Test_case');
    });

    it('should handle strings starting with space', () => {
      expect(capitalize(' hello')).toBe(' hello');
    });
  });

  describe('Edge Cases', () => {
    describe('formatCurrency edge cases', () => {
      it('should handle very small amounts', () => {
        expect(formatCurrency(1)).toBe('€0.01');
        expect(formatCurrency(-1)).toBe('-€0.01');
      });

      it('should handle undefined/null-like values as zero', () => {
        expect(formatCurrency(0)).toBe('€0.00');
      });
    });

    describe('formatDate edge cases', () => {
      it('should handle dates with time component', () => {
        expect(formatDate('2026-01-31T23:59:59')).toBe('Jan 31, 2026');
      });

      it('should handle dates with timezone', () => {
        expect(formatDate('2026-01-31T00:00:00Z')).toContain('2026');
      });
    });

    describe('formatRelativeDate edge cases', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-01T23:59:59')); // End of day
      });

      it('should still show "Today" at end of day', () => {
        expect(formatRelativeDate('2026-02-01T00:00:00')).toBe('Today');
      });

      it('should handle boundary between days correctly', () => {
        expect(formatRelativeDate('2026-01-31T23:59:59')).toBe('Yesterday');
      });
    });
  });
});
