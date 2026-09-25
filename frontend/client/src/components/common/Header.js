import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import store from '../../config/store';
import { formatPrice, formatShortPrice } from '../../utils/format';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  ...store.categories.map(category => ({
    label: category,
    to: `/products?category=${encodeURIComponent(category)}`
  }))
];

const IconButton = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="relative p-2 text-ink hover:text-accent transition-colors"
  >
    {children}
  </button>
);

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartCount, cartSummary } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchInput = useRef(null);
  const accountMenu = useRef(null);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (accountMenu.current && !accountMenu.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = e.target.search.value.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
  };

  const isActive = (to) => location.pathname + location.search === to;

  const cartCount = getCartCount();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="bg-ink text-white text-[11px] uppercase tracking-label text-center py-2 px-4">
        Free UK delivery on orders over {formatShortPrice(store.freeShippingOver)}
      </div>

      <div className="border-b border-line">
        <div className="shop-container flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-2 lg:hidden">
            <IconButton label="Open menu" onClick={() => setMenuOpen(open => !open)}>
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-lg w-5`}></i>
            </IconButton>
          </div>

          <Link to="/" className="font-display text-xl lg:text-2xl font-medium uppercase tracking-[0.3em] text-ink">
            {store.name}
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`text-[12px] uppercase tracking-[0.15em] py-2 border-b transition-colors ${
                  isActive(link.to) ? 'border-ink text-ink' : 'border-transparent text-ink/70 hover:text-ink'
                }`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <IconButton label="Search" onClick={() => setSearchOpen(open => !open)}>
              <i className="fa-solid fa-magnifying-glass text-[17px]"></i>
            </IconButton>

            <div className="relative hidden sm:block" ref={accountMenu}>
              <IconButton
                label="Account"
                onClick={() => (isAuthenticated ? setAccountOpen(open => !open) : navigate('/login'))}
              >
                <i className="fa-regular fa-user text-[17px]"></i>
              </IconButton>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-line shadow-lg py-2 text-sm">
                  <p className="px-4 py-2 text-muted truncate">Hi, {user?.name}</p>
                  <Link to="/account" className="block px-4 py-2 hover:bg-cream">My account</Link>
                  <Link to="/orders" className="block px-4 py-2 hover:bg-cream">My orders</Link>
                  {isAdmin && <Link to="/admin" className="block px-4 py-2 hover:bg-cream">Admin</Link>}
                  <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-cream border-t border-line mt-1">
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <Link to="/cart" aria-label="Cart" className="relative flex items-center gap-2 p-2 text-ink hover:text-accent transition-colors">
              <i className="fa-solid fa-bag-shopping text-[17px]"></i>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 left-5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] leading-[18px] text-center font-semibold">
                  {cartCount}
                </span>
              )}
              <span className="hidden md:inline text-xs font-medium ml-1">
                {formatPrice(cartSummary?.total || 0)}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-b border-line bg-white">
          <form onSubmit={handleSearch} className="shop-container py-5 flex gap-3">
            <input
              ref={searchInput}
              name="search"
              type="search"
              placeholder="Search products..."
              className="field flex-1"
            />
            <button type="submit" className="btn-dark">Search</button>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="lg:hidden border-b border-line bg-white">
          <div className="shop-container py-4 flex flex-col">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="py-3 text-sm uppercase tracking-[0.15em] border-b border-line last:border-0">
                {link.label}
              </Link>
            ))}
            <div className="pt-4 mt-2 flex flex-col gap-3 text-sm">
              {isAuthenticated ? (
                <>
                  <Link to="/account">My account</Link>
                  <Link to="/orders">My orders</Link>
                  {isAdmin && <Link to="/admin">Admin</Link>}
                  <button onClick={logout} className="text-left">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login">Sign in</Link>
                  <Link to="/register">Create account</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
