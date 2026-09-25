import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import CheckoutForm from '../components/checkout/CheckoutForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import orderService from '../services/orderService';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const { cartItems, cartSummary, discount, loading, fetchCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  // Kept so a retry after a declined card reuses the same order
  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [completed, setCompleted] = useState(false);

  const handleCheckout = async (shipping) => {
    if (!stripe || !elements) return;
    setPaymentError(null);

    try {
      let payment = pendingPayment;
      if (!payment) {
        const { order, clientSecret } = await orderService.createOrder({
          shippingAddress: shipping,
          billingAddress: shipping,
          discountCode: discount?.code
        });
        payment = { orderId: order.id, clientSecret };
        setPendingPayment(payment);
      }

      // Handles 3D Secure / bank verification when the card requires it
      const { error } = await stripe.confirmCardPayment(payment.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${shipping.firstName} ${shipping.lastName}`,
            address: {
              line1: shipping.address,
              city: shipping.city,
              state: shipping.state,
              postal_code: shipping.zipCode
            }
          }
        }
      });

      if (error) {
        setPaymentError(error.message);
        return;
      }

      try {
        await orderService.confirmPayment(payment.orderId);
      } catch (confirmError) {
        // The payment went through; the Stripe webhook will finish the order
        console.error('Payment confirmation error:', confirmError);
      }

      setCompleted(true);
      await fetchCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      const data = error.response?.data;
      if (data?.issues) {
        data.issues.forEach(issue => {
          toast.warning(`${issue.productName || 'Item'}: ${issue.issue}`);
        });
        await fetchCart();
        navigate('/cart');
        return;
      }
      toast.error(data?.error || 'Failed to place order. Please try again.');
      console.error('Checkout error:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (cartItems.length === 0 && !completed) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutForm onSubmit={handleCheckout} error={paymentError} />
        </div>

        <div>
          <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.Product?.name} x {item.quantity}</span>
                  <span>${(parseFloat(item.Product?.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {cartSummary && (
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartSummary.subtotal}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount.code})</span>
                    <span>-${cartSummary.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${cartSummary.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{parseFloat(cartSummary.shipping) === 0 ? 'Free' : `$${cartSummary.shipping}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${cartSummary.total}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
