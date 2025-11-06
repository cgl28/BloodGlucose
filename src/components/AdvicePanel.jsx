import React from "react";
import { Paper, Stack, Typography, Alert, AlertTitle, Chip, Box, Divider, Link } from "@mui/material";
import SectionHeader from "./SectionHeader";
import SummaryTable from "./SummaryTable";

export default function AdvicePanel({ rulesOutput, guidance }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
      <SectionHeader title="Advice" icon={null} subtitle="Alerts and recommendations (for human review)." />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Alerts</Typography>
        {rulesOutput.alerts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No active alerts from the entered data.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {rulesOutput.alerts.map((a, i) => (
              <Alert key={i} severity={a.severity === "stat" ? "error" : "warning"} variant="outlined">
                <AlertTitle>{a.title}</AlertTitle>
                {a.detail}
                {a.evidence && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>Evidence: {a.evidence}</Typography>}
              </Alert>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Recommendations</Typography>
        {rulesOutput.recs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No specific medication suggestions from the entered data.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {rulesOutput.recs.map((r, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Chip label="Advisory" color="primary" size="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{r.title}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{r.body}</Typography>
                {r.caveat && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{r.caveat}</Typography>}
              </Paper>
            ))}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Prototype only — check local guidelines and consult the diabetes team.
        </Typography>
      </Box>


      {/*} summary table removed from here. 
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Summary (last 24h)</Typography>
        <SummaryTable stats={rulesOutput.stats} />
      </Box>
        */}


      <Box sx={{ mt: 2 }}>
        <SectionHeader title="Guidance & Policies" icon={null} />
        <Stack spacing={1} sx={{ mt: 1 }}>
          {guidance.map((g) => (
            <Link key={g.label} href={g.href} underline="hover" target="_blank" rel="noreferrer">
              {g.label}
            </Link>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}