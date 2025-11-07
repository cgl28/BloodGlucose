import { INSULIN_CATALOGUE } from '../data/insulins';
import { readingsInWindow, groupByDate, mean as patternsMean } from '../utils/patterns';

// fallback mean if patterns.mean isn't available
function mean(vals) {
  if (typeof patternsMean === 'function') return patternsMean(vals);
  if (!Array.isArray(vals) || vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function classifyInsulin(insulinId) {
  const meta = INSULIN_CATALOGUE?.find(i => i.id === insulinId);
  if (!meta) return { acting: null, role: null, meta: null };
  const acting = meta.acting;
  const role =
    acting === 'long' || acting === 'intermediate' ? 'basal'
    : acting === 'rapid' || acting === 'short' ? 'bolus'
    : acting === 'premix' ? 'premix'
    : null;
  return { acting, role, meta };
}

function boundedPercentChange(current, pct, minAbs = 1, maxPct = 20) {
  const pctClamped = Math.max(-maxPct, Math.min(maxPct, pct));
  const proposed = Math.round(current * (1 + pctClamped / 100));
  if (pctClamped !== 0 && Math.abs(proposed - current) < minAbs) {
    return proposed + (pctClamped > 0 ? 1 : -1);
  }
  return Math.max(1, proposed);
}

/**
 * Named export: titrationSuggestions
 * normalized: [{ ts, tsDate, value }]
 * insulinMeds: [{ insulinId, doseUnits, time }]
 */
export function titrationSuggestions(
  normalized = [],
  insulinMeds = [],
  targets = { fastingHigh: 8, ppHigh: 12 },
  steroidOn = false,
  days = 3
) {
  const out = [];
  const byDay = (groupByDate(normalized) || []).slice(-days);
  const fastingMeans = [];
  let overnightHypoDays = 0;

  for (const day of byDay) {
    const fast = readingsInWindow(day.list || [], 4, 8);
    const fastVals = fast.map(r => r.value).filter(v => v != null);
    const fastMean = fastVals.length ? mean(fastVals) : null;
    if (fastMean !== null) fastingMeans.push(fastMean);

    const overnight = readingsInWindow(day.list || [], 0, 6);
    if (overnight.some(r => r.value < 4)) overnightHypoDays += 1;
  }

  const fastingMean = (fastingMeans.length ? mean(fastingMeans) : null);

  const basalEntries = (insulinMeds || [])
    .map(m => ({ ...m, ...classifyInsulin(m.insulinId) }))
    .filter(m => m.role === 'basal' && typeof m.doseUnits === 'number');

  if (basalEntries.length) {
    const b = basalEntries[0];
    const dose = b.doseUnits;

    if (overnightHypoDays > 0) {
      const newDose = boundedPercentChange(dose, -10);
      out.push({
        title: 'Overnight lows — consider basal reduction',
        body: `Overnight hypoglycaemia on ${overnightHypoDays}/${byDay.length} recent days. Consider reducing basal ~10% (e.g. ${dose} → ${newDose} units).`
      });
    } else if (fastingMean !== null && fastingMean > (targets.fastingHigh ?? 10)) {
      const diff = fastingMean - (targets.fastingHigh ?? 10);
      const pct = diff >= 4 ? 10 : diff >= 2 ? 7 : 5;
      const newDose = boundedPercentChange(dose, pct);
      out.push({
        title: 'Morning highs — consider basal uptitration',
        body: `Mean fasting BG ~${fastingMean.toFixed(1)} mmol/L over ${byDay.length}d. Consider +${pct}% basal (e.g. ${dose} → ${newDose} units).`
      });
    }
  }

  const pmStart = 14, pmEnd = 22;
  const pmMeans = byDay
    .map(d => {
      const vals = (readingsInWindow(d.list || [], pmStart, pmEnd) || []).map(r => r.value).filter(v => v != null);
      return vals.length ? mean(vals) : null;
    })
    .filter(v => v !== null);
  const pmMean = (pmMeans.length ? mean(pmMeans) : null);

  const hasBolus = (insulinMeds || []).some(m => classifyInsulin(m.insulinId).role === 'bolus');

  if (pmMean !== null && pmMean > (steroidOn ? ((targets.ppHigh ?? 12) + 1) : (targets.ppHigh ?? 12))) {
    if (hasBolus) {
      out.push({
        title: 'Afternoon/evening highs — prandial/correction review',
        body: `PM mean ~${pmMean.toFixed(1)} mmol/L over ${byDay.length}d. Consider titrating prandial/correction dosing.`
      });
    } else {
      out.push({
        title: 'Afternoon/evening highs without bolus insulin',
        body: `PM mean ~${pmMean.toFixed(1)} mmol/L. Consider mealtime rapid insulin or correction dosing per local protocol.`
      });
    }
  }

  return out;
}

// also export default for compatibility with default imports
export default titrationSuggestions;
