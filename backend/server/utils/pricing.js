// Single source of truth for cart and order totals.
// All math is done in integer cents to avoid floating point rounding errors.

const CURRENCY = 'gbp';
// No VAT: the business is not VAT registered, and a UK business must not
// charge VAT unless it is. If you register, set this to 0.2 and make sure
// product prices are shown VAT-inclusive (required for UK consumer sales).
const TAX_RATE = 0;
const FREE_SHIPPING_THRESHOLD = 10000; // £100.00
const FLAT_SHIPPING = 1000; // £10.00

// Placeholder until discount codes live in the database
const DISCOUNT_CODES = {
  WELCOME10: { type: 'percentage', value: 10 },
  SAVE20: { type: 'percentage', value: 20 },
  FREESHIP: { type: 'shipping', value: 100 },
  FLAT50: { type: 'fixed', value: 50 }
};

const toCents = (amount) => Math.round(parseFloat(amount) * 100);
const toDollars = (cents) => (cents / 100).toFixed(2);

const findDiscount = (code) => {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  const discount = DISCOUNT_CODES[normalized];
  return discount ? { code: normalized, ...discount } : null;
};

// lines: [{ price, quantity }] where price is in dollars (as stored on Product)
const calculateTotals = (lines, discountCode) => {
  const subtotal = lines.reduce((sum, line) => sum + toCents(line.price) * line.quantity, 0);
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);
  const discount = findDiscount(discountCode);

  let discountAmount = 0;
  if (discount?.type === 'percentage') {
    discountAmount = Math.round(subtotal * discount.value / 100);
  } else if (discount?.type === 'fixed') {
    discountAmount = Math.min(discount.value * 100, subtotal);
  }

  const freeShippingEligible = subtotal > FREE_SHIPPING_THRESHOLD || discount?.type === 'shipping';
  const shipping = subtotal === 0 || freeShippingEligible ? 0 : FLAT_SHIPPING;
  const tax = Math.round((subtotal - discountAmount) * TAX_RATE);
  const total = subtotal - discountAmount + tax + shipping;

  return {
    itemCount,
    discount,
    cents: { subtotal, discountAmount, tax, shipping, total },
    subtotal: toDollars(subtotal),
    discountAmount: toDollars(discountAmount),
    tax: toDollars(tax),
    shipping: toDollars(shipping),
    total: toDollars(total),
    freeShippingEligible,
    freeShippingRemaining: freeShippingEligible ? '0.00' : toDollars(Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0))
  };
};

module.exports = {
  CURRENCY,
  calculateTotals,
  findDiscount,
  toCents,
  toDollars
};
