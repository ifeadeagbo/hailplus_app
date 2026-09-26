import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import store from '../config/store';
import { InfoPage, Section } from '../components/common/InfoPage';

// A mailto: link alone does nothing for people without a desktop mail app
// (most webmail users), so the address is shown and can be copied or
// opened in Gmail / Outlook on the web
const ContactPage = () => {
  const [copied, setCopied] = useState(false);
  const email = store.supportEmail;
  const subject = encodeURIComponent(`${store.name} enquiry`);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (error) {
      // Clipboard API unavailable or blocked: fall back to a hidden text field
      const field = document.createElement('textarea');
      field.value = email;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      if (!ok) return; // The address is still shown for copying by hand
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <InfoPage title="Contact us" showUpdated={false}>
      <p>
        Questions about an order, a return or a product? Email us and we'll get back to you as soon as we can.
      </p>

      {email ? (
        <div className="border border-line bg-cream p-6 sm:p-8">
          <p className="eyebrow mb-2">Email</p>
          <p className="text-xl sm:text-2xl font-medium break-all select-all">{email}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={copyAddress} className="btn-dark">
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
              {copied ? 'Copied' : 'Copy address'}
            </button>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Open in Gmail
            </a>
            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${subject}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Open in Outlook
            </a>
            <a href={`mailto:${email}?subject=${subject}`} className="btn-outline">
              Email app
            </a>
          </div>
        </div>
      ) : (
        <p className="bg-yellow-100 px-3 py-2">[support email coming soon]</p>
      )}

      <Section title="Before you write">
        <ul className="list-disc pl-6 space-y-2">
          <li>Include your <strong>order number</strong> (in <Link to="/orders" className="text-accent hover:underline">My Orders</Link> and your confirmation email).</li>
          <li>You can <strong>cancel an order</strong> yourself from My Orders until it ships.</li>
          <li>Returns and refunds are explained on our <Link to="/returns" className="text-accent hover:underline">Returns & Refunds</Link> page.</li>
          <li>Many questions are answered in the <Link to="/faq" className="text-accent hover:underline">FAQ</Link>.</li>
        </ul>
      </Section>

      <Section title="Where we are">
        <p>{store.name}, {store.address}, United Kingdom.</p>
      </Section>
    </InfoPage>
  );
};

export default ContactPage;
