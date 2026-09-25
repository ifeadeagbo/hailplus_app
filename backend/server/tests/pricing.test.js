const { calculateTotals, findDiscount } = require('../utils/pricing');

describe('calculateTotals', () => {
  test('adds flat shipping under the free shipping threshold and no tax', () => {
    const totals = calculateTotals([{ price: '14.99', quantity: 2 }]);
    expect(totals).toMatchObject({
      itemCount: 2,
      subtotal: '29.98',
      discountAmount: '0.00',
      tax: '0.00',
      shipping: '10.00',
      total: '39.98',
      freeShippingEligible: false,
      freeShippingRemaining: '70.02'
    });
  });

  test('ships free over £100', () => {
    const totals = calculateTotals([{ price: '100.01', quantity: 1 }]);
    expect(totals.shipping).toBe('0.00');
    expect(totals.freeShippingEligible).toBe(true);
  });

  test('exactly £100 still pays shipping', () => {
    expect(calculateTotals([{ price: '100.00', quantity: 1 }]).shipping).toBe('10.00');
  });

  test('empty cart costs nothing', () => {
    expect(calculateTotals([]).total).toBe('0.00');
  });

  test('percentage discount comes off the subtotal', () => {
    const totals = calculateTotals([{ price: '50.00', quantity: 1 }], 'welcome10');
    expect(totals.discount.code).toBe('WELCOME10');
    expect(totals.discountAmount).toBe('5.00');
    expect(totals.total).toBe('55.00'); // 50 - 5 + 10 shipping
  });

  test('fixed discount never exceeds the subtotal', () => {
    const totals = calculateTotals([{ price: '20.00', quantity: 1 }], 'FLAT50');
    expect(totals.discountAmount).toBe('20.00');
    expect(totals.tax).toBe('0.00');
  });

  test('FREESHIP removes shipping', () => {
    expect(calculateTotals([{ price: '20.00', quantity: 1 }], 'FREESHIP').shipping).toBe('0.00');
  });

  test('unknown code is ignored', () => {
    expect(calculateTotals([{ price: '20.00', quantity: 1 }], 'BOGUS').discount).toBeNull();
  });

  test('cents stay exact where floating point would drift', () => {
    // 0.1 + 0.2 style errors: 3 x £19.99 = £59.97 exactly
    const totals = calculateTotals([{ price: '19.99', quantity: 3 }]);
    expect(totals.cents.subtotal).toBe(5997);
    expect(totals.cents.total).toBe(5997 + 1000);
  });
});

test('charges in pounds with no VAT (business is not VAT registered)', () => {
  const { CURRENCY } = require('../utils/pricing');
  expect(CURRENCY).toBe('gbp');
  expect(calculateTotals([{ price: '100.00', quantity: 3 }]).tax).toBe('0.00');
});

describe('findDiscount', () => {
  test('is case and whitespace insensitive', () => {
    expect(findDiscount('  save20 ')).toMatchObject({ code: 'SAVE20', type: 'percentage', value: 20 });
  });

  test('returns null for empty input', () => {
    expect(findDiscount('')).toBeNull();
    expect(findDiscount(undefined)).toBeNull();
  });
});
