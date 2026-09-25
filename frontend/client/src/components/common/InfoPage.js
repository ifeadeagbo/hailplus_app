import React from 'react';
import store from '../../config/store';

// Layout for the policy and help pages
export const InfoPage = ({ title, showUpdated = true, children }) => (
  <div className="container mx-auto px-4 py-12 max-w-3xl">
    <h1 className="text-3xl font-bold mb-2">{title}</h1>
    {showUpdated && (
      <p className="text-sm text-gray-500 mb-8">Last updated: {store.legalLastUpdated}</p>
    )}
    <div className="space-y-6 text-gray-700 leading-relaxed">{children}</div>
  </div>
);

export const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    {children}
  </section>
);

export const SupportEmail = () => (
  <a href={`mailto:${store.supportEmail}`} className="text-blue-600 hover:underline">
    {store.supportEmail}
  </a>
);
