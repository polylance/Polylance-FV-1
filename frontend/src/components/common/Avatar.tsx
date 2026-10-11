import React from 'react';
import { Link } from 'react-router-dom';

export interface AvatarProps {
  address?: string;
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToProfile?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  address,
  src,
  name,
  size = 'md',
  className = '',
  linkToProfile = false,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : address
    ? address.slice(2, 4).toUpperCase()
    : 'U';

  const avatarContent = (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#EFF6FF] text-[#0047AB] font-semibold border border-[#E5E7EB] shrink-0 overflow-hidden ${sizeMap[size]} ${className}`}
      title={name || address || 'User'}
    >
      {src ? (
        <img
          src={src}
          alt={name || address || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (linkToProfile && address) {
    return (
      <Link
        to={`/profile/${address}`}
        className="inline-flex hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] rounded-full transition-opacity"
        title={`View ${name || address}'s profile`}
      >
        {avatarContent}
      </Link>
    );
  }

  return avatarContent;
};
