// Prices are stored and sent as numbers or decimal strings in pounds.
// Must match the currency the backend charges (backend/server/utils/pricing.js).
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const formatPrice = (amount) => gbp.format(parseFloat(amount) || 0);

// For marketing copy: "£100" instead of "£100.00" when there are no pence
const gbpWhole = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 });

export const formatShortPrice = (amount) => {
  const value = parseFloat(amount) || 0;
  return Number.isInteger(value) ? gbpWhole.format(value) : formatPrice(value);
};
