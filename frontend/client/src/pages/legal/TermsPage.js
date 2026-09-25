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
      <p>[PLACEHOLDER: where you ship to and typical delivery times.]</p>
    </Section>

    <Section title="Liability">
      <p>
        [PLACEHOLDER: limitation of liability clause. Have this reviewed by a lawyer for your country;
        consumer law often limits what can be excluded.]
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
