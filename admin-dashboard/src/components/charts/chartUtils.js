// Rounds a maximum up so that four equal tick intervals land on friendly numbers.
export function niceMax(v) {
  if (v <= 0) return 4;
  const raw = v / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag * 4;
}

export function compact(v) {
  if (v >= 1000000) return `${+(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${+(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

export function localeFor(lang) {
  return lang === 'fr' ? 'fr-FR' : 'en-GB';
}
