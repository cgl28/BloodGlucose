import React, { useMemo, useState } from "react";

// ===== NHS-style UI: MUI components =====
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Divider,
  Link,
  Chip,
  Alert,
  AlertTitle,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ScienceIcon from "@mui/icons-material/Science";
import MedicationIcon from "@mui/icons-material/Medication";
import InsightsIcon from "@mui/icons-material/Insights";
import LinkIcon from "@mui/icons-material/Link";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// components (extracted)
import SectionHeader from "./components/SectionHeader";
import ReadingsList from "./components/ReadingsList";
import MedicationSection from "./components/MedicationSection";
import AdvicePanel from "./components/AdvicePanel";
import GlucoseDayOverlayChart from './components/GlucoseDayOverlayChart'

// ===== DISCLAIMER =====
// This is a non-clinical demo for education only. Not for patient care.
// Maps simple rules to suggestions inspired by common UK inpatient diabetes guidance.
// Always seek local protocols and senior/diabetes team review.

// ---------- utils (from your original) ----------
function parseISOLocal(dt) {
  try { return new Date(dt); } catch { return null; }
}
function hoursDiff(a, b) { return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60)); }
function mean(nums) { if (!nums.length) return null; return nums.reduce((a, b) => a + b, 0) / nums.length; }
function inWindow(date, startHour, endHour) { const h = date.getHours(); return h >= startHour && h < endHour; }
function byLast24h(readings) { const now = new Date(); return readings.filter(r => hoursDiff(new Date(r.ts), now) <= 24); }
function sortByTime(readings) { return [...readings].sort((a, b) => new Date(a.ts) - new Date(b.ts)); }
function asNumber(x) { const n = Number(x); return Number.isFinite(n) ? n : null; }

const initialReadingRow = () => ({ id: crypto.randomUUID(), ts: "", value: "" });

/*  
// demo data load example (from ./data/demo3days.json)

import demo3days from './data/demo3days.json'

function loadDemo() {
  setReadings(demo3days.readings.map(r => ({ id: crypto.randomUUID(), ...r })))
  setMeds(demo3days.meds)
  setContext(demo3days.context)
}

*/

const demoData = {
  readings: [
    // Day 1 (2025-11-02)
    { id: crypto.randomUUID(), ts: "2025-11-02T07:10", value: 5.8 },
    { id: crypto.randomUUID(), ts: "2025-11-02T12:45", value: 15.8 },
    { id: crypto.randomUUID(), ts: "2025-11-02T21:20", value: 8.6 },
    
    // Day 2 (2025-11-03)
    { id: crypto.randomUUID(), ts: "2025-11-03T08:10", value: 6.2 },
    { id: crypto.randomUUID(), ts: "2025-11-03T14:20", value: 13.8 },
    { id: crypto.randomUUID(), ts: "2025-11-03T22:15", value: 5.6 },

    // Day 2 (2025-11-04)
    { id: crypto.randomUUID(), ts: "2025-11-04T07:55", value: 3.4 }, // hypo
    { id: crypto.randomUUID(), ts: "2025-11-04T16:05", value: 12.6 },
    { id: crypto.randomUUID(), ts: "2025-11-04T21:40", value: 10.8 },

    // Day 3 (2025-11-05)
    { id: crypto.randomUUID(), ts: "2025-11-05T09:00", value: 7.1 },
    { id: crypto.randomUUID(), ts: "2025-11-05T15:30", value: 14.2 }, // steroid pattern
    { id: crypto.randomUUID(), ts: "2025-11-05T23:10", value: 6.4 },
  ],
  meds: {
    basalInsulin: true, basalDose: 18,
    bolusInsulin: false,
    su: true, suName: "Gliclazide", suDose: 80,
    metformin: true, sglt2: false, steroidAM: true
  },
  context: { egfr: 28, npo: false, weightKg: 78 }
}


// ---------- rules engine (from your original) ----------
function runRules(readings, meds, context) {
  const recs = []; const alerts = [];

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

  if (anySevere) {
    const last = last24.find(r => r.value < 3.0);
    alerts.push({
      title: "Severe hypoglycaemia (BG < 3.0 mmol/L)",
      severity: "stat",
      detail: `Treat immediately per hypo protocol; recheck in 10–15 min. Last severe at ${last?.ts ?? "unknown"}.`,
      evidence: `BG readings: ${last24.map(r => r.value).join(", ")}`
    });
  } else if (anyHypo) {
    const last = last24.find(r => r.value < 4.0);
    alerts.push({
      title: "Hypoglycaemia (BG < 4.0 mmol/L)",
      severity: "stat",
      detail: `Treat per protocol; recheck in 10–15 min. Last hypo at ${last?.ts ?? "unknown"}.`,
      evidence: `BG readings: ${last24.map(r => r.value).join(", ")}`
    });
  }

  const recurrent = hypos.length >= 2;
  if (recurrent) {
    alerts.push({
      title: "Recurrent hypoglycaemia in 24h",
      severity: "warn",
      detail: `${hypos.length} episodes recorded in last 24h. Review causes/meds and add overnight monitoring plan.`,
      evidence: hypos.map(h => `${h.value}@${h.ts}`).join(", ")
    });
  }

  if (meds.steroidAM && pmMean != null && pmMean > 12 && n24h >= 3) {
    alerts.push({
      title: "Steroid-pattern hyperglycaemia (PM)",
      severity: "warn",
      detail: `Mean BG between 14:00–22:00 is ${pmMean.toFixed(1)} mmol/L with AM steroid ticked. Consider steroid-pattern adjustments.`,
    });
  }

  if (meds.su && anyHypo) {
    recs.push({
      title: `Sulfonylurea and hypoglycaemia`,
      body: `A hypo occurred while on a sulfonylurea (${meds.suName || "SU"}). Consider holding tonight and review dose/regimen. Add increased monitoring for the next 24 hours.`,
      caveat: `Review renal function, nutrition status, and timing of doses.`,
    });
  }

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

  const stats = {
    n24h: n24h,
    anyHypo,
    anySevere,
    mean24h: mean24h ?? null,
    overnightLows,
    pmMean: pmMean ?? null,
  };

  return { alerts, recs, stats };
}

// ---------- NHS Theme ----------
const nhsTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#005EB8" }, // NHS Blue
    secondary: { main: "#003087" },
    error: { main: "#D5281B" },
    warning: { main: "#FFB81C" },
    success: { main: "#007F3B" }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: `'Arial', 'Helvetica', 'Inter', system-ui, -apple-system, sans-serif`,
    h6: { fontWeight: 600 },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { border: "1px solid #E5E7EB" } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 12 } } },
    MuiChip:   { styleOverrides: { root: { fontWeight: 600 } } },
  }
});

// ---------- Error Boundary ----------
function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    const onError = (e) => { setErr(e?.error ?? e); };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);
  if (err) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <AlertTitle>Runtime error</AlertTitle>
          {String(err?.message ?? err)}
        </Alert>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Check the browser console and the dev server terminal for the full stack trace.
        </Typography>
      </Box>
    );
  }
  return children;
}

// ---------- Main Component ----------
export default function InpatientDiabetesAdvisor() {
  const [readings, setReadings] = useState([initialReadingRow()]);
// Diabetes type: 'type1' | 'type2' | 'other'
  const [diabetesType, setDiabetesType] = useState('type2');
  const [meds, setMeds] = useState({
    basalInsulin: false, basalDose: "",
    bolusInsulin: false,
    su: false, suName: "Gliclazide", suDose: "",
    metformin: false, sglt2: false,
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

  // ---- readings handlers (used by ReadingsList)
  function addRow(now = false) {
    setReadings(prev => [...prev, { id: crypto.randomUUID(), ts: now ? new Date().toISOString().slice(0,16) : "", value: "" }]);
  }
  function clearRows() { setReadings([initialReadingRow()]); }
  function loadDemo() {
    setReadings(demoData.readings.map(r => ({...r, ts: r.ts, value: r.value })));
    setMeds(demoData.meds); setContext(demoData.context);
  }
 
  // Use single-selection (free DataGrid only supports 1 selected row).
  const [selection, setSelection] = useState(null);

  // Guidance links (fill with your Trust/JBDS/NICE URLs)
  const guidance = [
    { label: "Inpatient Hypoglycaemia protocol (JBDS)", href: "#", },
    { label: "Steroid-induced hyperglycaemia (JBDS)", href: "#", },
    { label: "NICE Diabetes in adults (NG28)", href: "#", },
    { label: "Trust insulin safety policy", href: "#", },
  ];

  return (
    <ErrorBoundary>
      <ThemeProvider theme={nhsTheme}>
        <AppBar position="sticky" color="primary" enableColorOnDark>
          <Toolbar sx={{ gap: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Inpatient Diabetes Advisor — Prototype</Typography>
            <Stack direction="row" spacing={1}>
              <Button onClick={loadDemo} variant="outlined" color="inherit" startIcon={<ContentCopyIcon />}>Load demo</Button>
              <Button onClick={clearRows} variant="outlined" color="inherit" startIcon={<RestartAltIcon />}>Clear</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ my: 3 }}>
          <Box
            component="section"
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            }}
          >
            {/* LEFT COLUMN: Inputs */}
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                <SectionHeader title="Diabetes type" subtitle="Select the patient’s diabetes type" />
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={diabetesType==='type1'} onChange={() => setDiabetesType('type1')} />}
                    label="Type 1"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={diabetesType==='type2'} onChange={() => setDiabetesType('type2')} />}
                    label="Type 2"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={diabetesType==='other'} onChange={() => setDiabetesType('other')} />}
                    label="Other"
                  />
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2 }}>
                <SectionHeader icon={<ScienceIcon />} title="Blood glucose readings" subtitle="Enter capillary or lab values (mmol/L) with timestamps (local time)." />
                <ReadingsList readings={readings} setReadings={setReadings} addRow={addRow} clearRows={clearRows} />

                {/* 24-hour overlay chart (inserted under the input list) */}
                <Box sx={{ mt: 2 }}>
                  <SectionHeader title="24-hour overlay chart" subtitle="Each colour is a different day — target band highlighted." />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2, mt: 1 }}>
                    <Paper elevation={0} sx={{ p: 2, height: 360 }}>
                      <GlucoseDayOverlayChart readings={normalized} yDomain={[0, 25]} />
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, height: 360 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Summary (last 24h)</Typography>
                      <SummaryTable stats={rulesOutput.stats} />
                    </Paper>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Paper elevation={0} sx={{ p: 2 }}>
                <SectionHeader icon={<MedicationIcon />} title="Medication & context" subtitle="Tick what applies and add doses where relevant." />
                <MedicationSection meds={meds} setMeds={setMeds} context={context} setContext={setContext} />
              </Paper>
            </Box>

            {/* RIGHT COLUMN: Advice & Links */}
            <Box>
              <AdvicePanel rulesOutput={rulesOutput} guidance={guidance} />
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// ---------- Reusable bits ----------
function SummaryTable({ stats }) {
  const rows = [
    ["# readings (24h)", stats.n24h?.toString() ?? "—"],
    ["Any hypo < 4.0", stats.anyHypo ? "Yes" : "No"],
    ["Any severe < 3.0", stats.anySevere ? "Yes" : "No"],
    ["Mean BG (24h)", stats.mean24h != null ? stats.mean24h.toFixed(1) + " mmol/L" : "—"],
    ["Overnight lows (00–06)", (stats.overnightLows ?? 0).toString()],
    ["Afternoon/evening mean (14–22)", stats.pmMean != null ? stats.pmMean.toFixed(1) + " mmol/L" : "—"],
  ];
  return (
    <Box component="table" sx={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: "4px 8px", color: "#6B7280", borderBottom: "1px solid #eee" }}>{k}</td>
            <td style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid #eee" }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </Box>
  );
}
