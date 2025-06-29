import React from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';

interface ImageProps extends Omit<NextImageProps, 'src'> {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Custom Image component that handles both external URLs and blob URLs
 * Uses Next.js Image for external URLs and regular img for blob URLs
 */
const Image: React.FC<ImageProps> = ({ src, alt, className, ...props }) => {
  // Check if it's a blob URL (starts with blob:)
  const isBlobUrl = src.startsWith('blob:');
  
  if (isBlobUrl) {
    // Use regular img tag for blob URLs (from IndexedDB)
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }
  
  // Use Next.js Image for external URLs
  return (
    <NextImage
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default Image; 