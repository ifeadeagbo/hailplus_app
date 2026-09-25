import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CheckoutForm from '../components/checkout/CheckoutForm';
import orderService from '../services/orderService';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = async (formData) => {
    try {
      const order = await orderService.createOrder({
        shippingAddress: formData,
        billingAddress: formData.billingAddress || formData,
        paymentMethodId: formData.paymentMethodId
      });
      
      await clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders`);
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      console.error('Checkout error:', error);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutForm onSubmit={handleCheckout} />
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
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(getCartTotal() * 1.1).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Including tax</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;