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

    <Section title="Your legal right to cancel">
      <p>
        Under the Consumer Contracts Regulations 2013 you can cancel most online orders within 14 days
        of receiving them, without giving a reason, and get a full refund within 14 days of us receiving
        the goods back (or proof you sent them). Our returns policy below is in addition to this and does
        not affect your statutory rights, including your rights under the Consumer Rights Act 2015 for
        faulty goods.
      </p>
    </Section>

    <Section title="Returning an item">
      <p>
        You can return most items within {store.returnWindowDays} days of delivery. Items must be unused, in their
        original condition and packaging, with proof of purchase.
      </p>
      <p>
        Unless they are faulty, we cannot accept returns of items made or personalised to your order, or of
        sealed items that have been opened and cannot be resold for hygiene reasons (such as underwear,
        earphones and personal care products).
      </p>
      <p>To start a return, email <SupportEmail /> with your order number (shown in My Orders and in your confirmation email).
        We'll reply with return instructions.</p>
      <p>
        Return postage is free for faulty, damaged or incorrect items. For any other return, you pay the
        cost of sending the item back.
      </p>
    </Section>

    <Section title="Damaged or wrong items">
      <p>
        If your order arrives faulty, damaged or isn't what you ordered, email <SupportEmail /> as soon as you can
        with your order number and a photo. If you tell us within 30 days of delivery, you can choose a full
        refund. After that, we will repair or replace the item, or refund you if that isn't possible.
      </p>
    </Section>

    <Section title="Refunds">
      <p>
        Once we receive and inspect your return, we refund the original payment method. Refunds usually
        appear within 5–10 business days, depending on your bank. You'll get an email when the refund is issued.
      </p>
      <p>
        We also refund the standard delivery charge you paid if the item was faulty, damaged or incorrect,
        or if you cancel the whole order within 14 days of receiving it. For other returns, the original
        delivery charge is not refunded.
      </p>
    </Section>
  </InfoPage>
);

export default ReturnsPage;
