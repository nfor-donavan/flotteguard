import { useEffect, useState } from 'react';

// Tracks an element's rendered width so SVG charts can lay out in real pixels.
export default function useWidth(ref, fallback = 640) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width) || fallback);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return width;
}
