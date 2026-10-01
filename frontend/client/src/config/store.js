// Your business details, shown in the header, footer and legal pages.
// The legal pages are written for a UK store: have them reviewed before
// trading for real.
const store = {
  name: 'Hailplus',
  domain: 'hailplus.co.uk',
  // Fill in once the business is registered, e.g. 'Hailplus Ltd'
  legalName: '',
  address: 'Aberdeen',
  // Shown in the footer, policy pages and emails. If emptied, the Contact
  // link is hidden and the policy pages show a "coming soon" note
  supportEmail: 'hailplusinc@gmail.com',
  // Governing law for the Terms, e.g. "the State of Texas, United States"
  jurisdiction: 'Scotland',
  returnWindowDays: 30,
  // Delivery estimates in working days, shown in the Terms and FAQ
  dispatchDays: 2,
  deliveryDays: '3–5',

  // Shown in the FAQ; must match backend/server/utils/pricing.js
  flatShipping: 10,
  freeShippingOver: 100,
  // 0 while not VAT registered. If you register, set this and TAX_RATE
  // in pricing.js to 20, and show VAT-inclusive prices
  taxRatePercent: 0,
  legalLastUpdated: 'October 1, 2026',

  // Shop categories (must match product categories in the database)
  categories: ['Clothing', 'Electronics', 'Home & Garden', 'Sports', 'Books'],

  // Home page imagery (free Unsplash photos; replace with your own)
  images: {
    hero: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80&auto=format&fit=crop',
    bannerLeft: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop',
    bannerRight: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop'
  },

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
