import { INSULIN_CATALOGUE } from '../data/insulins';
import { readingsInWindow, groupByDate, mean as importedMean } from '../utils/patterns';

// local fallback for mean if the imported one is missing/undefined
function mean(vals) {
  if (typeof importedMean === "function") return importedMean(vals);
  if (!Array.isArray(vals) || vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function classifyInsulin(insulinId) {
  const meta = INSULIN_CATALOGUE.find(i => i.id === insulinId);
  if (!meta) return { acting: null, role: null };
  const acting = meta.acting;
  const role =
    acting === 'long' || acting === 'intermediate' ? 'basal'
    : acting === 'rapid' || acting === 'short' ? 'bolus'
    : acting === 'premix' ? 'premix'
    : null;
  return { acting, role, meta };
}

// Suggest ±% change with caps/safety
function boundedPercentChange(current, pct, minAbs = 1, maxPct = 20) {
  const pctClamped = Math.max(-maxPct, Math.min(maxPct, pct));
  const proposed = Math.round(current * (1 + pctClamped/100));
  // ensure at least ±1 unit change if pct intended non-zero
  if (pctClamped !== 0 && Math.abs(proposed - current) < minAbs) {
    return proposed + (pctClamped > 0 ? 1 : -1);
  }
  return Math.max(1, proposed);
}

/**
 * readings: normalized list [{ts, value}], recentDays: number of days to consider (e.g., 3)
 * insulinMeds: [{ insulinId, doseUnits, time }]
 * steroidOn: boolean (to bias PM windows)
 */
function titrationSuggestions(
  normalized,
  insulinMeds,
  targets,
  steroidOn,
  days = 3
) {
  const out = [];

  const byDay = groupByDate(normalized).slice(-days);
  const fastingMeans = [];
  let overnightHypoDays = 0;

  for (const day of byDay) {
    const fast = readingsInWindow(day.list, 4, 8);
    const fastMean = mean(fast.map(r => r.value));
    if (fastMean !== null && typeof fastMean !== 'undefined') fastingMeans.push(fastMean);

    const overnight = readingsInWindow(day.list, 0, 6);
    if (overnight.some(r => r.value < 4)) overnightHypoDays += 1;
  }

  const fastingMean = (fastingMeans.length ? mean(fastingMeans) : null);

  // Identify basal insulin entries
  const basalEntries = (insulinMeds || [])
    .map(m => ({ ...m, ...classifyInsulin(m.insulinId) }))
    .filter(m => m.role === 'basal' && typeof m.doseUnits === 'number');

  // 1) Basal titration logic (AM highs vs overnight hypos)
  if (basalEntries.length) {
    const b = basalEntries[0]; // assume one basal for now
    const dose = b.doseUnits;

    if (overnightHypoDays > 0) {
      const newDose = boundedPercentChange(dose, -10);
      out.push({
        title: 'Overnight lows — consider basal reduction',
        body: `Overnight hypoglycaemia detected on ${overnightHypoDays}/${byDay.length} recent days. Consider reducing basal ~10% (e.g., ${dose} → ${newDose} units) and review evening intake/timing.`,
      });
    } else if (fastingMean !== null && fastingMean > targets.fastingHigh) {
      const diff = fastingMean - targets.fastingHigh;
      const pct = diff >= 4 ? 10 : diff >= 2 ? 7 : 5;
      const newDose = boundedPercentChange(dose, pct);
      out.push({
        title: 'Morning highs — consider basal uptitration',
        body: `Mean fasting BG ~${fastingMean.toFixed(1)} mmol/L over ${byDay.length}d. Consider +${pct}% basal (e.g., ${dose} → ${newDose} units). Check for missed doses and injection timing.`,
      });
    }
  }

  // 2) Post-prandial pattern → bolus/correction adjustments
  const pmStart = 14, pmEnd = 22;
  const pmMeans = byDay
    .map(d => mean(readingsInWindow(d.list, pmStart, pmEnd).map(r => r.value)))
    .filter(v => v!==null);
  const pmMean = (pmMeans.length ? mean(pmMeans) : null);

  const hasBolus = (insulinMeds || []).some(m => classifyInsulin(m.insulinId).role === 'bolus');

  if (pmMean !== null && pmMean > (steroidOn ? (targets.ppHigh + 1) : targets.ppHigh)) {
    if (hasBolus) {
      out.push({
        title: 'Afternoon/evening highs — prandial/correction review',
        body: `PM mean ~${pmMean.toFixed(1)} mmol/L over ${byDay.length}d. Consider bolus titration or adjusting the correction scale, especially with steroid AM use.`,
      });
    } else {
      out.push({
        title: 'Afternoon/evening highs without bolus insulin',
        body: `PM mean ~${pmMean.toFixed(1)} mmol/L. Consider introducing mealtime rapid insulin or structured correction dosing per local protocol.`,
      });
    }
  }

  return out;
}

export default titrationSuggestions;
