import React from 'react';
import { useForm } from 'react-hook-form';
import { CardElement, useStripe } from '@stripe/react-stripe-js';

const fields = [
  { name: 'firstName', label: 'First Name', half: true },
  { name: 'lastName', label: 'Last Name', half: true },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City', half: true },
  { name: 'state', label: 'State', half: true },
  {
    name: 'zipCode',
    label: 'ZIP Code',
    half: true,
    pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code' }
  }
];

// Collects the shipping address and card details. The parent page creates
// the order and confirms the payment with Stripe.
const CheckoutForm = ({ onSubmit, error }) => {
  const stripe = useStripe();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.name} className={field.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
              <label className="block text-sm font-medium mb-2">{field.label}</label>
              <input
                type="text"
                {...register(field.name, {
                  required: `${field.label} is required`,
                  ...(field.pattern && { pattern: field.pattern })
                })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Payment</h2>
        <div className="px-4 py-3 border rounded-lg">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Payments are processed securely by Stripe. Your bank may ask you to verify the payment.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Placing order...' : 'Place Order'}
      </button>
    </form>
  );
};

export default CheckoutForm;
