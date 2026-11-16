// Image URLs in the DB are either absolute (Cloudinary) or relative
// "/demo/..." paths served by the backend. Resolve both against the API origin.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function assetUrl(u) {
  if (!u) return null;
  return /^https?:\/\//.test(u) ? u : API_ORIGIN + u;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
