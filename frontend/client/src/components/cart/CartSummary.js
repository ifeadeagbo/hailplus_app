import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartSummary = () => {
  const { cartSummary, discount, applyDiscountCode, validateCart } = useCart();
  const [code, setCode] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      await applyDiscountCode(code.trim());
      setCode('');
    } catch (error) {
      // Toast is shown by the cart context
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const result = await validateCart();
      if (result.valid) {
        navigate('/checkout');
      }
    } catch (error) {
      console.error('Cart validation error:', error);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!cartSummary) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({cartSummary.itemCount} items)</span>
          <span>${cartSummary.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${cartSummary.tax}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{parseFloat(cartSummary.shipping) === 0 ? 'Free' : `$${cartSummary.shipping}`}</span>
        </div>
        {discount && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({discount.code})</span>
            <span>-${discount.discountAmount}</span>
          </div>
        )}
      </div>

      {!cartSummary.freeShippingEligible && (
        <p className="text-sm text-gray-500 mt-3">
          Add ${cartSummary.freeShippingRemaining} more for free shipping
        </p>
      )}

      <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>${cartSummary.total}</span>
      </div>

      <form onSubmit={handleApplyDiscount} className="flex mt-4 space-x-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          Apply
        </button>
      </form>

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {checkingOut ? 'Checking cart...' : 'Proceed to Checkout'}
      </button>
    </div>
  );
};

export default CartSummary;
