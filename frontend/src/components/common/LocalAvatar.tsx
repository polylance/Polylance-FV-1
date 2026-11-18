import React, { useState } from 'react';

interface LocalAvatarProps {
  address?: string;
  name?: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
  alt?: string;
}

const PALETTE = [
  { bg: '#0047AB', text: '#FFFFFF', border: '#0B4FBF' },
  { bg: '#0B0B0F', text: '#FFFFFF', border: '#1E293B' },
  { bg: '#0B4FBF', text: '#FFFFFF', border: '#2563EB' },
  { bg: '#1E293B', text: '#F8FAFC', border: '#334155' },
  { bg: '#0F172A', text: '#38BDF8', border: '#0284C7' },
];

export const LocalAvatar: React.FC<LocalAvatarProps> = ({
  address = '',
  name = '',
  avatarUrl = '',
  size = 32,
  className = '',
  alt = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // If a valid custom image URL is provided (not mock/external generator) and hasn't errored
  const cleanUrl = (avatarUrl || '').trim();
  const isValidCustomUrl =
    cleanUrl &&
    !imgError &&
    !cleanUrl.includes('dicebear.com') &&
    !cleanUrl.includes('unsplash.com');

  if (isValidCustomUrl) {
    return (
      <img
        src={cleanUrl}
        alt={alt || name || address || 'Avatar'}
        onError={() => setImgError(true)}
        className={`inline-block shrink-0 rounded-full object-cover select-none ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    );
  }

  // Deterministic color from address
  const cleanAddr = (address || '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < cleanAddr.length; i++) {
    hash = (hash * 31 + cleanAddr.charCodeAt(i)) >>> 0;
  }
  const colorIndex = PALETTE.length > 0 ? hash % PALETTE.length : 0;
  const theme = PALETTE[colorIndex] || PALETTE[0];

  // Derive 1-2 characters initials
  let initials = '';
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    } else {
      initials = name.slice(0, 2).toUpperCase();
    }
  } else if (cleanAddr.startsWith('0x') && cleanAddr.length >= 4) {
    initials = cleanAddr.slice(2, 4).toUpperCase();
  } else {
    initials = 'PL';
  }

  const fontSize = Math.max(10, Math.floor(size * 0.38));

  return (
    <div
      className={`inline-flex items-center justify-center font-bold select-none shrink-0 rounded-full font-mono tracking-wider ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1.5px solid ${theme.border}`,
        fontSize: `${fontSize}px`,
      }}
      title={name || address || 'PolyLance User'}
    >
      {initials}
    </div>
  );
};

