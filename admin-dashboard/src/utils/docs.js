const DAY = 24 * 60 * 60 * 1000;

// Whole days from today (local midnight) until a date. Negative = already past.
export function daysUntil(date) {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / DAY);
}

// 'expired' | 'soon' (<= 7 days) | 'warn' (<= 30 days) | 'ok'
export function docState(days) {
  if (days === null || days === undefined) return 'ok';
  if (days < 0) return 'expired';
  if (days <= 7) return 'soon';
  if (days <= 30) return 'warn';
  return 'ok';
}

// yyyy-MM-dd for <input type="date">, without a timezone shift.
export function toDateInputValue(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The nearest-expiring vehicle document, or null.
export function nearestDoc(vehicle) {
  const docs = vehicle?.documents;
  if (!docs) return null;
  const items = [
    { type: 'insurance', days: daysUntil(docs.insuranceExpiry) },
    { type: 'vignette', days: daysUntil(docs.vignetteExpiry) }
  ].filter((i) => i.days !== null);
  if (!items.length) return null;
  return items.sort((a, b) => a.days - b.days)[0];
}
