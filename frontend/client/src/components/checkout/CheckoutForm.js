import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

const CheckoutForm = ({ onSubmit }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const submit = async (shipping) => {
    if (!stripe || !elements) return;
    setCardError(null);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
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
    });

    if (error) {
      setCardError(error.message);
      return;
    }

    await onSubmit({ ...shipping, paymentMethodId: paymentMethod.id });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
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
        {cardError && (
          <p className="text-red-500 text-sm mt-2">{cardError}</p>
        )}
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
