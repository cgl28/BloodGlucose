import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// helper: format “minutes since midnight” → HH:mm
function fmtHm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

// pick distinct strokes; add more if needed
const STROKES = [
  "#005EB8", // NHS blue
  "#007F3B", // NHS green
  "#6C2E91", // NHS purple-ish
  "#FFB81C", // NHS yellow
  "#D5281B", // NHS red
  "#00A3A3",
  "#231F20",
];

/**
 * readings: normalized [{ id, ts, value, tsDate }]
 * yDomain: [min, max] (optional)
 */
export default function GlucoseDayOverlayChart({
  readings = [],
  yDomain = [0, 25],
  chartHeight = 320,
}) {
  // build overlay dataset: group by calendar day and merge by minutes since midnight
  const { data, dayLabels } = useMemo(() => {
    // accept either normalized (tsDate) or raw (ts) forms
    const rows = readings
      .map(r => {
        const date = r.tsDate ? r.tsDate : r.ts ? new Date(r.ts) : null;
        const value = typeof r.value === "number" ? r.value : Number(r.value);
        if (!(date instanceof Date) || isNaN(date) || !Number.isFinite(value)) return null;
        const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const mins = date.getHours() * 60 + date.getMinutes();
        return { dayKey, mins, value };
      })
      .filter(Boolean);

    if (!rows.length) return { data: [], dayLabels: [] };

    // group by dayKey
    const groups = {};
    rows.forEach(r => {
      groups[r.dayKey] = groups[r.dayKey] || [];
      groups[r.dayKey].push(r);
    });
    const dayKeys = Object.keys(groups).sort();

    // collect all unique minute x positions
    const minsSet = new Set();
    dayKeys.forEach(k => groups[k].forEach(r => minsSet.add(r.mins)));
    const allMins = Array.from(minsSet).sort((a, b) => a - b);

    // merge into array of objects { mins, d0:val, d1:val, ... }
    const data = allMins.map(mins => {
      const obj = { mins, label: fmtHm(mins) };
      dayKeys.forEach((k, i) => {
        const found = groups[k].find(r => r.mins === mins);
        obj[`d${i}`] = found ? found.value : null;
      });
      return obj;
    });

    const dayLabels = dayKeys.map((k, i) => ({ key: `d${i}`, label: k }));

    return { data, dayLabels };
  }, [readings]);

  if (!data.length) {
    return (
      <div style={{ height: chartHeight, display: "grid", placeItems: "center", color: "#6b7280" }}>
        <div>No valid glucose readings to plot.</div>
      </div>
    );
  }

  return (
    // use a fixed pixel height so Recharts can measure correctly
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="mins"
          domain={[0, 24 * 60]}
          tickFormatter={(v) => fmtHm(v)}
          type="number"
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        <YAxis domain={[yDomain[0], yDomain[1]]} />
        <Tooltip labelFormatter={(v) => fmtHm(v)} />
        <Legend verticalAlign="top" wrapperStyle={{ top: -6 }} />
        { /* render a Line per day */ }
        {dayLabels.map((d, i) => (
          <Line
            key={d.key}
            type="monotone"
            dataKey={d.key}
            stroke={STROKES[i % STROKES.length]}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
            connectNulls
            name={d.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
