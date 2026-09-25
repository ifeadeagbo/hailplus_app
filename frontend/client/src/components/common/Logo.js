import React from 'react';
import store from '../../config/store';

// Vector recreation of the Hailplus mark: three nested gold arcs.
// Replace with the designer's original SVG when available.
export const LogoMark = ({ className = 'h-9 w-9' }) => (
  <svg viewBox="4 0 40 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="hailplus-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f3d27a" />
        <stop offset="45%" stopColor="#d4a73a" />
        <stop offset="100%" stopColor="#a8791c" />
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#hailplus-gold)" strokeLinecap="butt">
      {/* Three arcs from a shared top edge, sweeping round to the lower left */}
      <path d="M38 4 A28 28 0 0 0 28.4 58.3" strokeWidth="8" />
      <path d="M38 13 A19 19 0 0 0 31.5 49.9" strokeWidth="6" />
      <path d="M38 21.5 A10.5 10.5 0 0 0 34.4 41.9" strokeWidth="4.5" />
    </g>
  </svg>
);

const Logo = ({ className = '', size = 'md' }) => {
  const sizes = {
    md: { mark: 'h-9 w-[23px] lg:h-10 lg:w-[25px]', text: 'text-2xl lg:text-[28px]' },
    sm: { mark: 'h-8 w-5', text: 'text-xl' }
  }[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={sizes.mark} />
      <span
        className={`font-logo font-bold lowercase leading-none tracking-tight bg-gradient-to-br from-[#e9c15c] via-[#c9982c] to-[#9c6f16] bg-clip-text text-transparent ${sizes.text}`}
      >
        {store.name}
      </span>
    </span>
  );
};

export default Logo;
