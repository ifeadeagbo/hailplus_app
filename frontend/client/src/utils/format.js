// Prices are stored and sent as numbers or decimal strings in pounds.
// Must match the currency the backend charges (backend/server/utils/pricing.js).
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const formatPrice = (amount) => gbp.format(parseFloat(amount) || 0);
