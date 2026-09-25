import React from 'react';
import store from '../../config/store';
import { MARK_PATH, MARK_TRANSFORM, MARK_VIEWBOX } from './logoMark';

// Mark from the supplied logo file, with a gold gradient based on its #D4AF37
export const LogoMark = ({ className = 'h-9 w-7' }) => (
  <svg viewBox={MARK_VIEWBOX} className={className} aria-hidden="true">
    <defs>
      {/* y is flipped: the traced shape is stored upside down and flipped for display */}
      <linearGradient id="hailplus-gold" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#ecd27a" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#a8841f" />
      </linearGradient>
    </defs>
    <g transform={MARK_TRANSFORM} fill="url(#hailplus-gold)">
      <path d={MARK_PATH} />
    </g>
  </svg>
);

const Logo = ({ className = '', size = 'md' }) => {
  const sizes = {
    md: { mark: 'h-9 w-[27px] lg:h-10 lg:w-[30px]', text: 'text-2xl lg:text-[28px]' },
    sm: { mark: 'h-8 w-6', text: 'text-xl' }
  }[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={sizes.mark} />
      <span
        className={`font-logo font-bold lowercase leading-none tracking-tight bg-gradient-to-br from-[#e3c25a] via-[#d4af37] to-[#a8841f] bg-clip-text text-transparent ${sizes.text}`}
      >
        {store.name}
      </span>
    </span>
  );
};

export default Logo;
