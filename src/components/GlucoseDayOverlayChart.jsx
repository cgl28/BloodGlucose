import React, { useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceArea, CartesianGrid
} from 'recharts'

// helper: format “minutes since midnight” → HH:mm
function fmtHm(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${hh}:${mm}`
}

// pick distinct strokes; add more if needed
const STROKES = [
  '#005EB8', // NHS blue
  '#007F3B', // NHS green
  '#6C2E91', // NHS purple-ish
  '#FFB81C', // NHS yellow
  '#D5281B', // NHS red
  '#00A3A3',
  '#231F20',
]

/**
 * readings: [{ id, ts: 'YYYY-MM-DDTHH:mm', value: number }]
 * yDomain: [min, max] (optional)
 */
export default function GlucoseDayOverlayChart({ readings = [], yDomain = [0, 25] }) {
  // group readings by calendar date; map x = minutes since midnight
  const grouped = useMemo(() => {
    const byDate = new Map()
    for (const r of readings) {
      if (!r.ts || r.value == null) continue
      const d = new Date(r.ts)
      if (Number.isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
      const mins = d.getHours() * 60 + d.getMinutes()
      const arr = byDate.get(key) || []
      arr.push({ x: mins, y: Number(r.value), iso: r.ts })
      byDate.set(key, arr)
    }
    // sort per day
    for (const [k, arr] of byDate) arr.sort((a, b) => a.x - b.x)
    return Array.from(byDate.entries()).map(([date, data]) => ({ date, data }))
  }, [readings])

  // recharts expects a single array; we’ll overlay multiple <Line>s, each reading day
  // XAxis uses the same domain 0..1440 across days
  const xDomain = [0, 24 * 60]

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <LineChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={xDomain}
            dataKey="x"
            tickFormatter={fmtHm}
            ticks={[0, 240, 480, 720, 960, 1200, 1440]}
            label={{ value: 'Time of day', position: 'insideBottom', offset: -2 }}
          />
          <YAxis
            type="number"
            domain={yDomain}
            label={{ value: 'BG (mmol/L)', angle: -90, position: 'insideLeft' }}
          />

          {/* Shaded target band 6–10, hypo <4, optional high >12 */}
          <ReferenceArea y1={6} y2={10} strokeOpacity={0} fill="#007F3B" fillOpacity={0.06} />
          <ReferenceArea y1={0} y2={4} strokeOpacity={0} fill="#D5281B" fillOpacity={0.08} />
          <ReferenceArea y1={12} y2={yDomain[1]} strokeOpacity={0} fill="#FFB81C" fillOpacity={0.06} />

          <Tooltip
            formatter={(val, name, p) => [val.toFixed(1) + ' mmol/L', p.payload?.date || 'BG']}
            labelFormatter={(lab) => fmtHm(lab)}
          />
          <Legend />

          {grouped.map((g, idx) => (
            <Line
              key={g.date}
              name={g.date}
              type="monotone"
              data={g.data}
              dataKey="y"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              stroke={STROKES[idx % STROKES.length]}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
