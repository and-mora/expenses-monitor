/**
 * Currency formatting utilities
 * Handles conversion between cents and euros, and formatting for display
 */

/**
 * Format an amount in cents to a currency string
 * @param cents - Amount in cents
 * @param currency - Currency code (default: 'EUR')
 * @returns Formatted currency string
 */
export const formatCurrency = (cents: number, currency = 'EUR'): string => {
  const euros = cents / 100;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(euros);
};

/**
 * Convert cents to euros
 * @param cents - Amount in cents
 * @returns Amount in euros
 */
export const centsToEuros = (cents: number): number => {
  return cents / 100;
};

/**
 * Convert euros to cents
 * @param euros - Amount in euros
 * @returns Amount in cents (rounded to avoid floating point issues)
 */
export const eurosToCents = (euros: number): number => {
  return Math.round(euros * 100);
};
