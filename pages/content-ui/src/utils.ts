/**
 * Formats a number as a price with proper currency formatting
 * @param price - The numeric price value
 * @param currency - The currency symbol (default: '$')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '$', locale: string = 'en-US'): string {
  // Handle edge cases
  if (isNaN(price) || price < 0) {
    return `${currency}0.00`;
  }

  // Format with 2 decimal places
  const formattedNumber = price.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${currency}${formattedNumber}`;
}