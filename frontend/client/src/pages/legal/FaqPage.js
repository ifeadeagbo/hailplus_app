import React from 'react';
import { Link } from 'react-router-dom';
import store from '../../config/store';
import { InfoPage, SupportEmail } from '../../components/common/InfoPage';

const faqs = [
  {
    q: 'How much is shipping?',
    a: <>Shipping is ${store.flatShipping} per order, and free on orders over ${store.freeShippingOver}.</>
  },
  {
    q: 'Is tax included in prices?',
    a: <>No. Tax ({store.taxRatePercent}%) is added at checkout and shown before you pay.</>
  },
  {
    q: 'Which payment methods do you accept?',
    a: <>Visa, Mastercard and American Express, processed securely by Stripe. Your bank may ask you to verify the payment.</>
  },
  {
    q: 'Do I need an account to shop?',
    a: <>You can browse and fill your cart without one. You'll be asked to sign in or create an account at checkout, and your cart comes with you.</>
  },
  {
    q: 'How do I track my order?',
    a: <>Go to <Link to="/orders" className="text-blue-600 hover:underline">My Orders</Link>. When your order ships, we email you the tracking number.</>
  },
  {
    q: 'Can I cancel my order?',
    a: <>Yes, from <Link to="/orders" className="text-blue-600 hover:underline">My Orders</Link>, any time before it ships. You're refunded in full automatically.</>
  },
  {
    q: 'How do returns work?',
    a: <>See our <Link to="/returns" className="text-blue-600 hover:underline">Returns & Refunds</Link> policy. Most items can be returned within {store.returnWindowDays} days.</>
  },
  {
    q: 'How long do refunds take?',
    a: <>Refunds usually appear within 5–10 business days, depending on your bank.</>
  },
  {
    q: 'I forgot my password.',
    a: <>Use <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password</Link> to get a reset link by email.</>
  },
  {
    q: 'Where do you ship?',
    a: <>[PLACEHOLDER: countries/regions you ship to and typical delivery times.]</>
  }
];

const FaqPage = () => (
  <InfoPage title="Frequently Asked Questions" showUpdated={false}>
    <div className="divide-y border rounded-lg bg-white">
      {faqs.map(({ q, a }) => (
        <details key={q} className="p-4 group">
          <summary className="font-semibold cursor-pointer list-none flex justify-between">
            {q}
            <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <p className="mt-3 text-gray-700">{a}</p>
        </details>
      ))}
    </div>
    <p>Still have a question? Email <SupportEmail />.</p>
  </InfoPage>
);

export default FaqPage;
