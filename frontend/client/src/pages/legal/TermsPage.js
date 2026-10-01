import React from 'react';
import { Link } from 'react-router-dom';
import store, { businessName } from '../../config/store';
import { InfoPage, Section, SupportEmail } from '../../components/common/InfoPage';

const TermsPage = () => (
  <InfoPage title="Terms of Service">
    <p>
      These terms apply to your use of this website and any purchase you make
      from {businessName} ("we"), {store.address}. By placing an order you agree to them.
    </p>

    <Section title="Your account">
      <p>
        You are responsible for keeping your password safe and for activity on your account. Tell us
        at <SupportEmail /> if you think someone else has accessed it. We may suspend accounts used for
        fraud or abuse.
      </p>
    </Section>

    <Section title="Orders and prices">
      <p>
        Prices are in pounds sterling (GBP). Shipping is added at checkout and shown before you pay.
        Your order is accepted when payment succeeds and we send an order confirmation email.
      </p>
      <p>
        We may cancel an order and refund you in full if an item turns out to be unavailable, if a price
        was clearly wrong, or if we suspect fraud.
      </p>
    </Section>

    <Section title="Payment">
      <p>Payments are processed securely by Stripe. We accept Visa, Mastercard and American Express.</p>
    </Section>

    <Section title="Shipping, cancellations and returns">
      <p>
        See our <Link to="/returns" className="text-blue-600 hover:underline">Returns & Refunds</Link> policy
        and <Link to="/faq" className="text-blue-600 hover:underline">FAQ</Link>. Nothing in these terms
        limits rights you have under consumer protection law.
      </p>
      <p>
        We deliver to addresses in the United Kingdom only. Orders are usually dispatched
        within {store.dispatchDays} working days and arrive {store.deliveryDays} working days after that.
        These are estimates; if your order has not arrived within 30 days, you can cancel it for a full refund.
      </p>
    </Section>

    <Section title="Liability">
      <p>
        If we fail to comply with these terms, we are responsible for loss or damage you suffer that is a
        foreseeable result of our failure. We are not responsible for loss that could not reasonably have
        been foreseen, for business losses (we supply goods for private use only), or for delays caused by
        events outside our control.
      </p>
      <p>
        We do not exclude or limit our liability where it would be unlawful to do so. This includes
        liability for death or personal injury caused by our negligence, for fraud, and for breach of your
        legal rights as a consumer, including the right to goods that are as described and of satisfactory
        quality.
      </p>
    </Section>

    <Section title="Governing law">
      <p>These terms are governed by the laws of {store.jurisdiction}.</p>
    </Section>

    <Section title="Contact">
      <p>Questions about these terms? Email <SupportEmail />.</p>
    </Section>
  </InfoPage>
);

export default TermsPage;
