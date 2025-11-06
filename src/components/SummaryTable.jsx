import React from "react";
import { Box } from "@mui/material";

export default function SummaryTable({ stats }) {
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