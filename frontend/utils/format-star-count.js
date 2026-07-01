// Compact formatter for the GitHub star count in the nav badge: < 1000 stays
// exact, larger values collapse to a one-decimal "k" / "M" (trailing ".0"
// dropped). Returns '' for anything that isn't a usable non-negative number, so
// the caller can hide the count when the fetch fails or hasn't landed.

const UNITS = [
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'k' },
];

export function formatStarCount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
  if (value < 1000) return String(Math.floor(value));

  for (const { value: unit, suffix } of UNITS) {
    if (value >= unit) {
      const scaled = value / unit;
      // Three-or-more-digit results (e.g. 123k) read better without a decimal.
      const str = scaled >= 100
        ? String(Math.round(scaled))
        : scaled.toFixed(1).replace(/\.0$/, '');
      return str + suffix;
    }
  }
  return String(Math.floor(value));
}
