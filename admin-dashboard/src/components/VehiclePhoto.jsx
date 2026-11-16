import React from 'react';
import { assetUrl } from '../utils/assets';
import Icon from './Icon';

// Cover photo with a tasteful placeholder when a vehicle has none yet.
export default function VehiclePhoto({ vehicle, src, className = '', alt }) {
  const url = assetUrl(src || vehicle?.photos?.[0]);
  if (url) return <img className={`vphoto ${className}`} src={url} alt={alt || vehicle?.makeModel || ''} loading="lazy" />;
  return (
    <div className={`vphoto vphoto-empty ${className}`} role="img" aria-label={alt || vehicle?.makeModel || ''}>
      <Icon name="car" size={28} />
    </div>
  );
}
