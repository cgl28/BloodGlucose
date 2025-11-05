import React, { useMemo, useState } from "react";
import Badge from "./components/Badge";

// ===== DISCLAIMER =====
// This is a non-clinical demo for education only. Not for patient care.
// Maps simple rules to suggestions inspired by common UK inpatient diabetes guidance.
// Always seek local protocols and senior/diabetes team review.

function parseISOLocal(dt) {
  // Accepts 'YYYY-MM-DDTHH:MM' (no seconds) and returns Date
  try {
    return new Date(dt);
  } catch (e) {
    return null;
  }
}

function hoursDiff(a, b) {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60));
}

function mean(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function inWindow(date, startHour, endHour) {
  const h = date.getHours();
  // window inclusive of start, exclusive of end
  return h >= startHour && h < endHour;
}

function byLast24h(readings) {
  const now = new Date();
  return readings.filter(r => hoursDiff(new Date(r.ts), now) <= 24);
}

function sortByTime(readings) {
  return [...readings].sort((a, b) => new Date(a.ts) - new Date(b.ts));
}

function asNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

const initialReadingRow = () => ({ id: crypto.randomUUID(), ts: "", value: "" });

const demoData = {
  readings: [
    { id: crypto.randomUUID(), ts: new Date(Date.now() - 23*3600*1000).toISOString().slice(0,16), value: 3.2 },
    { id: crypto.randomUUID(), ts: new Date(Date.now() - 20*3600*1000).toISOString().slice(0,16), value: 7.8 },
    { id: crypto.randomUUID(), ts: new Date(Date.now() - 8*3600*1000).toISOString().slice(0,16), value: 14.2 },
    { id: crypto.randomUUID(), ts: new Date(Date.now() - 6*3600*1000).toISOString().slice(0,16), value: 12.9 },
    { id: crypto.randomUUID(), ts: new Date(Date.now() - 2*3600*1000).toISOString().slice(0,16), value: 11.4 },
  ],
  meds: {
    basalInsulin: true,
    basalDose: 18,
    bolusInsulin: false,
    su: true,
    suName: "Gliclazide",
    suDose: 80,
    metformin: true,
    sglt2: false,
    steroidAM: true,
  },
  context: {
    egfr: 28,
    npo: false,
    weightKg: 78,
  }
};

export default function InpatientDiabetesAdvisor() {
  const [readings, setReadings] = useState([initialReadingRow()]);
  const [meds, setMeds] = useState({
    basalInsulin: false,
    basalDose: "",
    bolusInsulin: false,
    su: false,
    suName: "Gliclazide",
    suDose: "",
    metformin: false,
    sglt2: false,
    steroidAM: false,
  });
  const [context, setContext] = useState({ egfr: "", npo: false, weightKg: "" });

  const normalized = useMemo(() => {
    const rows = readings
      .map(r => ({ id: r.id, ts: r.ts, value: asNumber(r.value) }))
      .filter(r => r.ts && r.value !== null)
      .map(r => ({ ...r, tsDate: parseISOLocal(r.ts) }))
      .filter(r => r.tsDate instanceof Date && !isNaN(r.tsDate));
    return sortByTime(rows);
  }, [readings]);

  const rulesOutput = useMemo(() => runRules(normalized, meds, context), [normalized, meds, context]);

  function addRow() {
    setReadings(prev => [...prev, initialReadingRow()]);
  }
  function clearRows() {
    setReadings([initialReadingRow()]);
  }
  function loadDemo() {
    setReadings(demoData.readings.map(r => ({...r, ts: r.ts, value: r.value })));
    setMeds(demoData.meds);
    setContext(demoData.context);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Inpatient Diabetes Advisor — Prototype</h1>
          <div className="flex gap-2">
            <button onClick={loadDemo} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Load demo</button>
            <button onClick={clearRows} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Clear</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Left: inputs */}
        <section className="lg:col-span-2">
          <Card title="Recent blood glucose readings">
            <p className="text-sm text-gray-600 mb-3">Enter capillary or lab values (mmol/L) with timestamps (local time). Add multiple rows.</p>
            <div className="space-y-2">
              {readings.map((r, idx) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-4 text-sm text-gray-700">Timestamp</label>
                  <input type="datetime-local" value={r.ts} onChange={e => setReadings(prev => prev.map(x => x.id===r.id? {...x, ts: e.target.value }: x))} className="col-span-8 px-2 py-1.5 rounded border"/>

                  <label className="col-span-4 text-sm text-gray-700">BG (mmol/L)</label>
                  <input type="number" step="0.1" inputMode="decimal" value={r.value} onChange={e => setReadings(prev => prev.map(x => x.id===r.id? {...x, value: e.target.value }: x))} className="col-span-6 px-2 py-1.5 rounded border"/>
                  <button onClick={() => setReadings(prev => prev.filter(x => x.id!==r.id))} className="col-span-2 text-sm text-red-600 hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button onClick={addRow} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">+ Add row</button>
            </div>
          </Card>

          <Card title="Medications">
            <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-center">
              <div className="col-span-12 font-medium">Insulins</div>
              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={meds.basalInsulin} onChange={e=>setMeds(m=>({...m, basalInsulin:e.target.checked}))}/> Basal insulin prescribed</label>
              <input className="col-span-6 px-2 py-1.5 rounded border" placeholder="Basal dose (units/day)" type="number" value={meds.basalDose} onChange={e=>setMeds(m=>({...m, basalDose:e.target.value}))} />
              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={meds.bolusInsulin} onChange={e=>setMeds(m=>({...m, bolusInsulin:e.target.checked}))}/> Prandial (bolus) insulin prescribed</label>

              <div className="col-span-12 mt-2 font-medium">Oral/non-insulin agents</div>
              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={meds.su} onChange={e=>setMeds(m=>({...m, su:e.target.checked}))}/> Sulfonylurea</label>
              <div className="col-span-3">
                <input className="w-full px-2 py-1.5 rounded border" placeholder="Name" value={meds.suName} onChange={e=>setMeds(m=>({...m, suName:e.target.value}))}/>
              </div>
              <div className="col-span-3">
                <input className="w-full px-2 py-1.5 rounded border" placeholder="Dose mg/day" type="number" value={meds.suDose} onChange={e=>setMeds(m=>({...m, suDose:e.target.value}))}/>
              </div>

              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={meds.metformin} onChange={e=>setMeds(m=>({...m, metformin:e.target.checked}))}/> Metformin</label>
              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={meds.sglt2} onChange={e=>setMeds(m=>({...m, sglt2:e.target.checked}))}/> SGLT2 inhibitor</label>

              <div className="col-span-12 mt-2 font-medium">Steroids</div>
              <label className="col-span-12 flex items-center gap-2"><input type="checkbox" checked={meds.steroidAM} onChange={e=>setMeds(m=>({...m, steroidAM:e.target.checked}))}/> On once-daily AM prednisolone (or equivalent)</label>
            </div>
          </Card>

          <Card title="Clinical context">
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-sm">eGFR (mL/min/1.73m²)</label>
              <input type="number" className="col-span-8 px-2 py-1.5 rounded border" value={context.egfr} onChange={e=>setContext(c=>({...c, egfr: e.target.value}))}/>

              <label className="col-span-6 flex items-center gap-2"><input type="checkbox" checked={context.npo} onChange={e=>setContext(c=>({...c, npo: e.target.checked}))}/> Nil-by-mouth</label>

              <label className="col-span-4 text-sm">Weight (kg)</label>
              <input type="number" className="col-span-8 px-2 py-1.5 rounded border" value={context.weightKg} onChange={e=>setContext(c=>({...c, weightKg: e.target.value}))}/>
            </div>
          </Card>
        </section>

        {/* Right: outputs */}
        <section className="space-y-6">
          <Card title="Alerts">
            {rulesOutput.alerts.length === 0 ? (
              <Empty text="No active alerts from the entered data." />
            ) : (
              <ul className="space-y-3">
                {rulesOutput.alerts.map((a, i) => (
                  <li key={i} className={`p-3 rounded-lg border ${a.severity==='stat'?'border-red-300 bg-red-50':'border-amber-300 bg-amber-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{a.title}</div>
                      <Badge tone={a.severity==='stat'?'stat':'warn'}>{a.severity === 'stat' ? 'Urgent' : 'Alert'}</Badge>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{a.detail}</div>
                    {a.evidence && <div className="text-xs text-gray-500 mt-1">Evidence: {a.evidence}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recommendations (for human review)">
            {rulesOutput.recs.length === 0 ? (
              <Empty text="No specific medication suggestions from the entered data." />
            ) : (
              <ul className="space-y-3">
                {rulesOutput.recs.map((r, i) => (
                  <li key={i} className="p-3 rounded-lg border bg-white">
                    <div className="text-sm font-semibold">{r.title}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">{r.body}</div>
                    {r.caveat && <div className="text-xs text-gray-500 mt-1">{r.caveat}</div>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-500 mt-3">Prototype only — check local guidelines and consult diabetes team.
            </p>
          </Card>

          <Card title="Summary stats (from entered readings)">
            <SummaryTable stats={rulesOutput.stats} />
          </Card>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-8 text-xs text-gray-500">
        Built as a proof-of-concept for showcasing EPR integration. No clinical use.
      </footer>
    </div>
  );
}

function Card({ title, children, actions }) {
  return (
    <div className="rounded-2xl shadow-sm bg-white border hover:shadow-md transition-shadow">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-semibold text-lg">{title}</h2>
          {actions?.meta && <div className="text-xs text-gray-500">{actions.meta}</div>}
        </div>
        <div className="flex items-center gap-2">
          {actions?.btns?.map((b, i) => (
            <button key={i} onClick={b.onClick} className="text-sm px-2 py-1 rounded-md bg-white border hover:bg-gray-50">
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-sm text-gray-600 italic">{text}</div>;
}

function SummaryTable({ stats }) {
  const rows = [
    ["# readings (24h)", stats.n24h?.toString() ?? "—"],
    ["Any hypo <4.0", stats.anyHypo ? "Yes" : "No"],
    ["Any severe hypo <3.0", stats.anySevere ? "Yes" : "No"],
    ["Mean BG (24h)", stats.mean24h != null ? stats.mean24h.toFixed(1) + " mmol/L" : "—"],
    ["Overnight lows (00–06)", stats.overnightLows.toString()],
    ["Afternoon/evening mean (14–22)", stats.pmMean != null ? stats.pmMean.toFixed(1) + " mmol/L" : "—"],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <td className="py-1 pr-4 text-gray-600">{k}</td>
              <td className="py-1 font-medium">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Rules Engine (client-side for demo) =====
function runRules(readings, meds, context) {
  const recs = [];
  const alerts = [];

  const last24 = byLast24h(readings);
  const n24h = last24.length;
  const values24 = last24.map(r => r.value);
  const mean24h = mean(values24);

  const anyHypo = values24.some(v => v < 4.0);
  const anySevere = values24.some(v => v < 3.0);
  const hypos = last24.filter(r => r.value < 4.0);

  const overnight = last24.filter(r => inWindow(r.tsDate, 0, 6));
  const overnightLows = overnight.filter(r => r.value < 4.0).length;

  const pm = last24.filter(r => inWindow(r.tsDate, 14, 22));
  const pmMean = mean(pm.map(r => r.value));

  // --- Alerts ---
  if (anySevere) {
    const last = last24.find(r => r.value < 3.0);
    alerts.push({
      title: "Severe hypoglycaemia (BG < 3.0 mmol/L)",
      severity: "stat",
      detail: `Treat immediately per hypo protocol; recheck in 10–15 min. Last severe at ${last?.ts ?? "unknown"}.`,
      evidence: `BG readings: ${last24.map(r => r.value).join(", ")}`,
    });
  } else if (anyHypo) {
    const last = last24.find(r => r.value < 4.0);
    alerts.push({
      title: "Hypoglycaemia (BG < 4.0 mmol/L)",
      severity: "stat",
      detail: `Treat per protocol; recheck in 10–15 min. Last hypo at ${last?.ts ?? "unknown"}.`,
      evidence: `BG readings: ${last24.map(r => r.value).join(", ")}`,
    });
  }

  const recurrent = hypos.length >= 2;
  if (recurrent) {
    alerts.push({
      title: "Recurrent hypoglycaemia in 24h",
      severity: "warn",
      detail: `${hypos.length} episodes recorded in last 24h. Review causes/meds and add overnight monitoring plan.`,
      evidence: hypos.map(h => `${h.value}@${h.ts}`).join(", "),
    });
  }

  if (meds.steroidAM && pmMean != null && pmMean > 12 && n24h >= 3) {
    alerts.push({
      title: "Steroid-pattern hyperglycaemia (PM)",
      severity: "warn",
      detail: `Mean BG between 14:00–22:00 is ${pmMean.toFixed(1)} mmol/L with AM steroid ticked. Consider steroid-pattern adjustments.`,
    });
  }

  // --- Recommendations (advisory) ---
  // SU + any hypo → reduce/hold
  if (meds.su && anyHypo) {
    recs.push({
      title: `Sulfonylurea and hypoglycaemia`,
      body: `A hypo occurred while on a sulfonylurea (${meds.suName || "SU"}). Consider holding tonight and review dose/regimen. Add increased monitoring for the next 24 hours.`,
      caveat: `Review renal function, nutrition status, and timing of doses.`,
    });
  }

  // eGFR context for SU and metformin
  const egfr = asNumber(context.egfr);
  if (egfr != null && egfr < 30 && meds.su && anyHypo) {
    recs.push({
      title: "Renal impairment with SU and hypos",
      body: `eGFR ${egfr} with hypoglycaemia on an SU suggests higher risk of prolonged hypos. Consider stopping the SU and using an insulin-based regimen with review.`,
      caveat: `Discuss with senior/diabetes team; align to local renal dosing guidance.`,
    });
  }
  if (egfr != null && egfr < 30 && meds.metformin) {
    recs.push({
      title: "Renal impairment with metformin",
      body: `eGFR ${egfr}. Consider stopping metformin while inpatient and reassessing post-discharge.`,
      caveat: `Check local guidance; consider risks/benefits and indication.`,
    });
  }

  // Basal insulin adjustments heuristics (conservative, advisory only)
  const highs = last24.filter(r => r.value > 10);
  const lows = last24.filter(r => r.value < 4);

  if (meds.basalInsulin && highs.length >= 3 && lows.length === 0) {
    const dose = asNumber(meds.basalDose);
    const suggested = dose ? Math.max(1, Math.round(dose * 1.1)) : undefined; // +10%
    recs.push({
      title: "Possible basal insulin uptitration",
      body: `Frequent readings >10 mmol/L without hypos in 24h. Consider a cautious basal increase (~10%).${suggested?` Example: ${dose} → ${suggested} units`:""}`,
      caveat: `Check fasting/overnight values, nutrition status, and risk of hypoglycaemia.`,
    });
  }

  if (meds.basalInsulin && overnightLows >= 1) {
    const dose = asNumber(meds.basalDose);
    const suggested = dose ? Math.max(1, Math.round(dose * 0.9)) : undefined; // -10%
    recs.push({
      title: "Overnight lows — consider basal reduction",
      body: `Overnight hypoglycaemia detected. Consider basal dose reduction (~10%).${suggested?` Example: ${dose} → ${suggested} units`:""}`,
      caveat: `Review timing of basal, evening intake, and concurrent SUs.`,
    });
  }

  if (meds.bolusInsulin && pmMean != null && pmMean > 12 && !anyHypo) {
    recs.push({
      title: "Post-prandial hyperglycaemia pattern",
      body: `Afternoon/evening mean ${pmMean.toFixed(1)} mmol/L. Consider prandial dose titration or adding/adjusting correction scale per local protocol.`,
      caveat: `Check carbohydrate intake, missed doses, and injection technique.`,
    });
  }

  if (context.npo && meds.bolusInsulin) {
    recs.push({
      title: "NPO status with bolus insulin",
      body: `If patient is currently NPO, consider holding prandial insulin and using a basal ± correction regimen while NPO.`,
      caveat: `Ensure hypoglycaemia prevention plan and fluids if needed per local protocol.`,
    });
  }

  // Stats bundle
  const stats = {
    n24h,
    anyHypo,
    anySevere,
    mean24h: mean24h ?? null,
    overnightLows,
    pmMean: pmMean ?? null,
  };

  return { alerts, recs, stats };
}
