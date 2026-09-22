import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. "16/9", "1/1", "4/3"
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio,
  fallbackSrc,
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style,
      }}
    >
      {/* Shimmer / Blur placeholder until loaded */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/60 animate-pulse backdrop-blur-sm"
        />
      )}

      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError && fallbackSrc) {
            setHasError(true);
          } else {
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
