import React from 'react';
import { assetUrl, initials } from '../utils/assets';

export default function Avatar({ name, src, size = 32 }) {
  const url = assetUrl(src);
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (url) return <img className="avatar" style={style} src={url} alt={name || ''} loading="lazy" />;
  return (
    <span className="avatar avatar-initials" style={style} aria-label={name}>
      {initials(name)}
    </span>
  );
}
