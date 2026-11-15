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
        <linearGradient id="goldPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="goldShineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="crestBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>

      {/* Royal Crest Shield */}
      <path
        d="M32 4L54 12V28C54 42 44.5 54 32 60C19.5 54 10 42 10 28V12L32 4Z"
        fill="url(#crestBgGrad)"
        stroke="url(#goldPlateGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Classical Bank Pediment / Temple Roof */}
      <polygon points="32,15 46,23 18,23" fill="url(#goldShineGrad)" />
      <rect x="16" y="23" width="32" height="2" rx="0.5" fill="url(#goldPlateGrad)" />

      {/* 4 Pillars */}
      <rect x="19" y="27" width="4" height="15" rx="1" fill="url(#goldPlateGrad)" />
      <rect x="26" y="27" width="4" height="15" rx="1" fill="url(#goldPlateGrad)" />
      <rect x="34" y="27" width="4" height="15" rx="1" fill="url(#goldPlateGrad)" />
      <rect x="41" y="27" width="4" height="15" rx="1" fill="url(#goldPlateGrad)" />

      {/* Podium Steps */}
      <rect x="16" y="43" width="32" height="2.5" rx="0.5" fill="url(#goldShineGrad)" />
      <rect x="14" y="46.5" width="36" height="2.5" rx="0.5" fill="url(#goldPlateGrad)" />

      {/* Sovereign Star */}
      <circle cx="32" cy="19.5" r="1.5" fill="#FFFBEB" />
    </svg>
  );
};
