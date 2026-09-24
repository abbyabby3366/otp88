import React from 'react';

// The OTP88 shield mark. `idPrefix` keeps gradient ids unique when the logo appears more than once on a page.
export default function BrandLogo({ size = 26, idPrefix = 'brand', style }) {
  const g = (name) => `${idPrefix}-${name}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <defs>
        <linearGradient id={g('grad')} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={g('shield')} x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#050811" />
        </linearGradient>
        <linearGradient id={g('bolt')} x1="14" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path d="M20 3L35 8.5V19.5C35 28.2 28.6 34.5 20 37C11.4 34.5 5 28.2 5 19.5V8.5L20 3Z" fill={`url(#${g('shield')})`} stroke={`url(#${g('grad')})`} strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 5V35" stroke={`url(#${g('grad')})`} strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 2" />
      <path d="M7 19.5H33" stroke={`url(#${g('grad')})`} strokeWidth="1" strokeOpacity="0.15" />
      <path d="M21.5 8.5L13 20H19.5L17.5 30.5L27 18H20.5L21.5 8.5Z" fill={`url(#${g('bolt')})`} stroke="#060913" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="21.5" cy="8.5" r="1.5" fill="#34D399" />
      <circle cx="27" cy="18" r="1.5" fill="#38BDF8" />
      <circle cx="17.5" cy="30.5" r="1.5" fill="#818CF8" />
    </svg>
  );
}
