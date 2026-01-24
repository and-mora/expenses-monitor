import { format, parseISO, isValid } from 'date-fns';

/**
 * Format cents to currency display
 */
export function formatCurrency(
  amountInCents: number,
  currency: string = 'EUR',
  showSign: boolean = false
): string {
  const amount = amountInCents / 100;
  const formatted = new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign && amountInCents !== 0) {
    return amountInCents > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amountInCents < 0 ? `-${formatted}` : formatted;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Invalid date';
  return format(parsed, formatStr);
}

/**
 * Format relative date
 */
export function formatRelativeDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Invalid date';

  const now = new Date();
  const diff = now.getTime() - parsed.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  
  return format(parsed, 'MMM d');
}

/**
 * Get category color class
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: 'bg-category-food',
    transport: 'bg-category-transport',
    shopping: 'bg-category-shopping',
    entertainment: 'bg-category-entertainment',
    utilities: 'bg-category-utilities',
    health: 'bg-category-health',
    income: 'bg-category-income',
    other: 'bg-category-other',
  };
  return colors[category.toLowerCase()] || colors.other;
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: 'utensils',
    transport: 'car',
    shopping: 'shopping-bag',
    entertainment: 'film',
    utilities: 'zap',
    health: 'heart',
    income: 'trending-up',
    other: 'circle',
  };
  return icons[category.toLowerCase()] || icons.other;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
