// Your business details, shown in the header, footer and legal pages.
// Replace every value in [BRACKETS] before launch. The legal pages are
// starting-point drafts: have them reviewed for your business and country.
const store = {
  name: '[YOUR STORE NAME]',
  legalName: '[REGISTERED BUSINESS NAME]',
  address: '[BUSINESS ADDRESS]',
  supportEmail: '[support@yourdomain.com]',
  // Governing law for the Terms, e.g. "the State of Texas, United States"
  jurisdiction: '[STATE / COUNTRY]',
  returnWindowDays: 30,

  // Shown in the FAQ; must match backend/server/utils/pricing.js
  flatShipping: 10,
  freeShippingOver: 100,
  taxRatePercent: 10,
  legalLastUpdated: 'September 25, 2026',

  // Leave empty to hide a link
  social: {
    facebook: '',
    instagram: '',
    twitter: ''
  }
};

export default store;
