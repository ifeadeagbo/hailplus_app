import React from 'react';
import { Link } from 'react-router-dom';
import store from '../../config/store';

const socialLinks = [
  { name: 'Facebook', icon: 'fa-facebook-f', url: store.social.facebook },
  { name: 'Instagram', icon: 'fa-instagram', url: store.social.instagram },
  { name: 'Twitter', icon: 'fa-twitter', url: store.social.twitter }
].filter(link => link.url);

const FooterHeading = ({ children }) => (
  <h3 className="font-sans text-xs font-semibold uppercase tracking-label mb-5">{children}</h3>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-sm text-ink/70 hover:text-accent transition-colors">{children}</Link>
  </li>
);

const Footer = () => {
  return (
    <footer className="bg-cream mt-auto border-t border-line">
      <div className="shop-container py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="font-display text-xl uppercase tracking-[0.3em]">{store.name}</Link>
          <p className="mt-5 text-sm text-ink/70 leading-relaxed max-w-xs">
            Quality everyday products, tech and style, delivered across the UK from {store.address}.
          </p>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="h-9 w-9 flex items-center justify-center border border-ink/20 hover:bg-ink hover:text-white transition-colors"
                >
                  <i className={`fa-brands ${link.icon} text-sm`}></i>
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <FooterHeading>Shop</FooterHeading>
          <ul className="space-y-3">
            <FooterLink to="/products">All products</FooterLink>
            {store.categories.map(category => (
              <FooterLink key={category} to={`/products?category=${encodeURIComponent(category)}`}>{category}</FooterLink>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Help</FooterHeading>
          <ul className="space-y-3">
            <FooterLink to="/orders">Track my order</FooterLink>
            <FooterLink to="/returns">Returns & refunds</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/account">My account</FooterLink>
            {store.supportEmail && (
              <li>
                <a href={`mailto:${store.supportEmail}`} className="text-sm text-ink/70 hover:text-accent">Contact us</a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <FooterHeading>Legal</FooterHeading>
          <ul className="space-y-3">
            <FooterLink to="/terms">Terms of service</FooterLink>
            <FooterLink to="/privacy">Privacy policy</FooterLink>
            <FooterLink to="/cookies">Cookie policy</FooterLink>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shop-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-3xl text-ink/60" aria-label="Accepted payment methods">
            <i className="fa-brands fa-cc-visa" title="Visa"></i>
            <i className="fa-brands fa-cc-mastercard" title="Mastercard"></i>
            <i className="fa-brands fa-cc-amex" title="American Express"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
