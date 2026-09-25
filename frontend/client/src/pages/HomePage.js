import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import ProductList from '../components/products/ProductList';
import { FALLBACK_IMAGE } from '../components/products/ProductCard';
import store from '../config/store';
import { formatShortPrice } from '../utils/format';

const perks = [
  { icon: 'fa-truck-fast', title: 'Free UK delivery', text: `On orders over ${formatShortPrice(store.freeShippingOver)}` },
  { icon: 'fa-rotate-left', title: `${store.returnWindowDays}-day returns`, text: 'Changed your mind? Send it back' },
  { icon: 'fa-lock', title: 'Secure checkout', text: 'Card payments protected by Stripe' }
];

const SectionHeading = ({ eyebrow, title, link }) => (
  <div className="text-center mb-10">
    {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
    <h2 className="section-title">{title}</h2>
    {link && (
      <Link to={link.to} className="inline-block mt-4 text-xs uppercase tracking-label border-b border-ink pb-0.5 hover:text-accent hover:border-accent">
        {link.label}
      </Link>
    )}
  </div>
);

const Banner = ({ image, eyebrow, title, to, cta }) => (
  <Link to={to} className="group relative block overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-cream">
    <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <span className="inset-stroke" />
    <div className="relative h-full flex flex-col items-start justify-end p-8 sm:p-12">
      <p className="eyebrow text-ink mb-2">{eyebrow}</p>
      <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.1em] text-ink mb-5">{title}</h3>
      <span className="btn-light">{cta}</span>
    </div>
  </Link>
);

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredProducts, newest, ...byCategory] = await Promise.all([
          productService.getFeaturedProducts(),
          productService.getAllProducts({ limit: 8 }),
          ...store.categories.map(category => productService.getAllProducts({ category, limit: 1 }))
        ]);
        setFeatured(featuredProducts.slice(0, 8));
        setLatest(newest.products);
        setCategories(store.categories
          .map((name, i) => ({ name, count: byCategory[i].total, image: byCategory[i].products[0]?.image }))
          .filter(category => category.count > 0));
      } catch (error) {
        console.error('Error loading home page:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-cream">
        <img src={store.images.hero} alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent" />
        <div className="relative shop-container w-full">
          <div className="max-w-lg">
            <p className="eyebrow mb-4">New season</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light uppercase leading-[1.05] tracking-[0.08em] text-ink">
              Discover<br />
              <span className="font-medium">New Arrivals</span>
            </h1>
            <p className="mt-6 text-ink/80 max-w-md">
              Everyday essentials, tech and style, picked with care and delivered across the UK.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-dark">Shop now</Link>
              <Link to="/products?sort=price_asc" className="btn-outline bg-white/60">Shop by price</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-line">
        <div className="shop-container grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line">
          {perks.map(perk => (
            <div key={perk.title} className="flex items-center justify-center gap-4 py-6">
              <i className={`fa-solid ${perk.icon} text-xl text-accent`}></i>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em]">{perk.title}</p>
                <p className="text-sm text-muted">{perk.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="shop-container py-16 lg:py-24">
          <SectionHeading eyebrow="Browse" title="Shop by category" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {categories.map(category => (
              <Link key={category.name} to={`/products?category=${encodeURIComponent(category.name)}`} className="group block">
                <div className="overflow-hidden aspect-portrait bg-cream">
                  <img
                    src={category.image || FALLBACK_IMAGE}
                    alt={category.name}
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 text-center text-[11px] text-muted">{category.count} products</p>
                <p className="text-center text-sm uppercase tracking-[0.15em] group-hover:text-accent">{category.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="bg-cream py-16 lg:py-24">
        <div className="shop-container">
          <SectionHeading eyebrow={`${store.name}'s choice`} title={`${store.name} Picks`} link={{ to: '/products', label: 'View all' }} />
          <ProductList products={featured} loading={loading} />
        </div>
      </section>

      {/* Banners */}
      <section className="shop-container py-16 lg:py-24 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Banner
          image={store.images.bannerLeft}
          eyebrow="Tech"
          title="Smart & simple"
          to="/products?category=Electronics"
          cta="Shop electronics"
        />
        <Banner
          image={store.images.bannerRight}
          eyebrow="Just landed"
          title="Sound on"
          to="/products"
          cta="Shop now"
        />
      </section>

      {/* New arrivals */}
      <section className="shop-container pb-16 lg:pb-24">
        <SectionHeading eyebrow="Fresh in" title="New arrivals" link={{ to: '/products', label: 'Shop all' }} />
        <ProductList products={latest} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;
