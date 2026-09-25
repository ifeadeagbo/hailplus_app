// Your business details, shown in the header, footer and legal pages.
// Replace every value in [BRACKETS] before launch. The legal pages are
// starting-point drafts: have them reviewed for your business and country.
const store = {
  name: 'Hailplus',
  // Fill in once the business is registered, e.g. 'Hailplus Ltd'
  legalName: '',
  address: 'Aberdeen',
  // Leave empty until you have one: the Contact link is hidden and the
  // policy pages show a "coming soon" note
  supportEmail: '',
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

// How the business is named in the policy pages
export const businessName = store.legalName
  ? `${store.legalName} (trading as ${store.name})`
  : store.name;

export default store;
