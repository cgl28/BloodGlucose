// src/utils/patterns.js
// ---------------------

/**
 * Filter readings that fall between certain hours of the day.
 * startHour / endHour are in 24-hour format (e.g., 4, 8).
 */
export function readingsInWindow(readings, startHour, endHour) {
  return readings.filter(r => {
    const d = new Date(r.ts);
    const h = d.getHours() + d.getMinutes() / 60;
    return h >= startHour && h < endHour;
  });
}

/**
 * Group readings by date (YYYY-MM-DD).
 * Returns an array like [{ date: "2025-11-06", list: [readings...] }]
 */
export function groupByDate(readings) {
  const by = new Map();
  for (const r of readings) {
    const key = new Date(r.ts).toISOString().slice(0, 10);
    (by.get(key) || by.set(key, []).get(key)).push(r);
  }
  return Array.from(by.entries()).map(([date, list]) => ({ date, list }));
}

/**
 * Compute a simple arithmetic mean.
 * Returns null if the array is empty.
 */
export function mean(vals) {
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
