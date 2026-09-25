import React from 'react';
import { Link } from 'react-router-dom';
import store from '../../config/store';
import { InfoPage, Section, SupportEmail } from '../../components/common/InfoPage';

const ReturnsPage = () => (
  <InfoPage title="Returns & Refunds">
    <Section title="Cancelling an order">
      <p>
        You can cancel an order yourself from <Link to="/orders" className="text-blue-600 hover:underline">My Orders</Link> any
        time before it ships. You'll be refunded in full automatically.
      </p>
    </Section>

    <Section title="Returning an item">
      <p>
        You can return most items within {store.returnWindowDays} days of delivery. Items must be unused, in their
        original condition and packaging, with proof of purchase.
      </p>
      <p>[PLACEHOLDER: list any items that cannot be returned, e.g. opened software, personal care items, final-sale items.]</p>
      <p>To start a return, email <SupportEmail /> with your order number (shown in My Orders and in your confirmation email).
        We'll reply with return instructions.</p>
      <p>[PLACEHOLDER: who pays return shipping, e.g. "Return shipping is free for damaged or incorrect items; otherwise it is paid by the customer."]</p>
    </Section>

    <Section title="Damaged or wrong items">
      <p>
        If your order arrives damaged or isn't what you ordered, email <SupportEmail /> within [PLACEHOLDER: e.g. 7] days
        of delivery with your order number and a photo, and we'll make it right.
      </p>
    </Section>

    <Section title="Refunds">
      <p>
        Once we receive and inspect your return, we refund the original payment method. Refunds usually
        appear within 5–10 business days, depending on your bank. You'll get an email when the refund is issued.
      </p>
      <p>[PLACEHOLDER: whether original shipping costs are refunded.]</p>
    </Section>
  </InfoPage>
);

export default ReturnsPage;
