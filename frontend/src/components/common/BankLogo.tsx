import React from 'react';

interface BankLogoProps {
  className?: string;
  size?: number;
}

export const BankLogo: React.FC<BankLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="emeraldPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="35%" stopColor="#10B981" />
          <stop offset="70%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="emeraldShineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="emeraldBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B382D" />
          <stop offset="100%" stopColor="#041E18" />
        </linearGradient>
      </defs>

      {/* Royal Crest Shield */}
      <path
        d="M32 4L54 12V28C54 42 44.5 54 32 60C19.5 54 10 42 10 28V12L32 4Z"
        fill="url(#emeraldBgGrad)"
        stroke="url(#emeraldPlateGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Classical Bank Pediment / Temple Roof */}
      <polygon points="32,15 46,23 18,23" fill="url(#emeraldShineGrad)" />
      <rect x="16" y="23" width="32" height="2" rx="0.5" fill="url(#emeraldPlateGrad)" />

      {/* 4 Pillars */}
      <rect x="19" y="27" width="4" height="15" rx="1" fill="url(#emeraldPlateGrad)" />
      <rect x="26" y="27" width="4" height="15" rx="1" fill="url(#emeraldPlateGrad)" />
      <rect x="34" y="27" width="4" height="15" rx="1" fill="url(#emeraldPlateGrad)" />
      <rect x="41" y="27" width="4" height="15" rx="1" fill="url(#emeraldPlateGrad)" />

      {/* Podium Steps */}
      <rect x="16" y="43" width="32" height="2.5" rx="0.5" fill="url(#emeraldShineGrad)" />
      <rect x="14" y="46.5" width="36" height="2.5" rx="0.5" fill="url(#emeraldPlateGrad)" />

      {/* Sovereign Star */}
      <circle cx="32" cy="19.5" r="1.5" fill="#ECFDF5" />
    </svg>
  );
};
