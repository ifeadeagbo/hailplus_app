import React from 'react';
import store from '../../config/store';
import { InfoPage, Section, SupportEmail } from '../../components/common/InfoPage';

// Every cookie and storage item the site sets today. If you add analytics
// or advertising scripts, list them here and add a consent banner first.
const items = [
  { name: 'token', who: store.name, purpose: 'Keeps you signed in. Cannot be read by scripts on the page.', duration: '7 days, or until you sign out' },
  { name: 'sid', who: store.name, purpose: 'Only set while you sign in with Google or Facebook, to protect that sign-in from forgery.', duration: '15 minutes' },
  { name: 'guestCart (browser storage)', who: store.name, purpose: 'Remembers your cart before you sign in.', duration: 'Until you sign in or clear your browser data' },
  { name: '__stripe_mid, __stripe_sid', who: 'Stripe', purpose: "Set by Stripe's payment library to detect and prevent payment fraud.", duration: 'Up to 1 year / 30 minutes' }
];

const CookiesPage = () => (
  <InfoPage title="Cookie Policy">
    <p>
      Cookies are small files a website stores in your browser. {store.name} only uses cookies and browser
      storage that are strictly necessary for the site to work, so we do not ask for consent to them.
      We do not use advertising or analytics cookies.
    </p>

    <Section title="What we use">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Name</th>
              <th className="text-left p-3 border-b">Set by</th>
              <th className="text-left p-3 border-b">Purpose</th>
              <th className="text-left p-3 border-b">Duration</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.name} className="border-b">
                <td className="p-3 font-mono">{item.name}</td>
                <td className="p-3">{item.who}</td>
                <td className="p-3">{item.purpose}</td>
                <td className="p-3">{item.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>

    <Section title="Managing cookies">
      <p>
        You can block or delete cookies in your browser settings. If you block the cookies above,
        you will not be able to sign in or check out.
      </p>
      <p>Questions? Email <SupportEmail />.</p>
    </Section>
  </InfoPage>
);

export default CookiesPage;
