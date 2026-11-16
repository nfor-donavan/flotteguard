import React from 'react';

export function Skeleton({ h = 14, w = '100%', r = 8, style }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: 20, display: 'grid', gap: 14 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} h={18} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6, h = 260 }) {
  return (
    <div className="vehicle-grid">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} h={h} r={16} />
      ))}
    </div>
  );
}
