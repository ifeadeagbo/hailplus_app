import React from 'react';
import { Link } from 'react-router-dom';
import store, { businessName } from '../../config/store';
import { InfoPage, Section, SupportEmail } from '../../components/common/InfoPage';

const PrivacyPage = () => (
  <InfoPage title="Privacy Policy">
    <p>
      This policy explains what personal information {businessName} ("we") collects when
      you use this website, why, and the choices you have. Contact us at <SupportEmail /> or {store.address}.
    </p>

    <Section title="Information we collect">
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Account details:</strong> your name, email address and password. Passwords are stored only in hashed form; we cannot read them.</li>
        <li><strong>Sign-in with Google or Facebook:</strong> if you choose this, we receive your name, email address and an account identifier from that provider.</li>
        <li><strong>Orders:</strong> the items you buy, prices paid, shipping and billing addresses, order status and tracking numbers.</li>
        <li><strong>Payments:</strong> card payments are processed by Stripe. Your card number is entered directly into Stripe's secure form and never reaches our servers. We receive only a payment reference and its status.</li>
        <li><strong>Technical data:</strong> our servers log requests (IP address, pages requested, time) to keep the service secure and working.</li>
      </ul>
    </Section>

    <Section title="How we use it">
      <ul className="list-disc pl-6 space-y-2">
        <li>To create and secure your account and keep you signed in.</li>
        <li>To process, ship, cancel and refund your orders.</li>
        <li>To send emails about your orders and account (order confirmations, shipping updates, refunds, password resets).</li>
        <li>To prevent fraud and abuse, and to comply with legal and tax obligations.</li>
      </ul>
      <p>We do not sell your personal information. [PLACEHOLDER: if you add a newsletter or marketing emails, describe them here and how to unsubscribe.]</p>
    </Section>

    <Section title="Who we share it with">
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Stripe</strong>, to process payments and prevent fraud (<a className="text-blue-600 hover:underline" href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's privacy policy</a>).</li>
        <li><strong>Our email provider</strong>, to deliver order and account emails. [PLACEHOLDER: name your email provider.]</li>
        <li><strong>Our hosting provider</strong>, which stores the website and database. [PLACEHOLDER: name your hosting provider and where data is stored.]</li>
        <li><strong>Shipping carriers</strong>, who receive your name and shipping address to deliver your order.</li>
        <li>Authorities, when required by law.</li>
      </ul>
    </Section>

    <Section title="How long we keep it">
      <p>
        We keep your account information while your account is active. If you delete your account, we erase
        your name, email address and sign-in details straight away. Order records (items, prices and delivery
        addresses) are kept for 6 years, as UK tax rules require, even after you delete your account.
      </p>
    </Section>

    <Section title="Your rights">
      <p>
        You can view and update your name in <Link to="/account" className="text-blue-600 hover:underline">My Account</Link> and
        see your order history in <Link to="/orders" className="text-blue-600 hover:underline">My Orders</Link>.
        You can delete your account yourself at any time from My Account. To request a copy of your data or
        correct it, email <SupportEmail />.
        Under UK data protection law (UK GDPR) you also have the right to object to or restrict how we use your
        data, and to complain to the Information Commissioner's Office
        (<a className="text-blue-600 hover:underline" href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">ico.org.uk</a>).
      </p>
    </Section>

    <Section title="Cookies">
      <p>
        We only use cookies that are needed for the site to work. See our <Link to="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>.
      </p>
    </Section>

    <Section title="Changes">
      <p>We will post any changes to this policy on this page and update the date above.</p>
    </Section>
  </InfoPage>
);

export default PrivacyPage;
