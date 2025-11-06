import React from "react";
import { Grid, Typography, Stack, FormControlLabel, Checkbox, TextField } from "@mui/material";

export default function MedicationSection({ meds, setMeds, context, setContext }) {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Insulins</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel
            control={<Checkbox checked={meds.basalInsulin} onChange={e => setMeds(m => ({ ...m, basalInsulin: e.target.checked }))} />}
            label="Basal insulin"
          />
          <TextField
            label="Basal dose (units/day)"
            type="number"
            value={meds.basalDose}
            onChange={e => setMeds(m => ({ ...m, basalDose: e.target.value }))}
            sx={{ width: 240 }}
          />
          <FormControlLabel
            control={<Checkbox checked={meds.bolusInsulin} onChange={e => setMeds(m => ({ ...m, bolusInsulin: e.target.checked }))} />}
            label="Prandial (bolus) insulin"
          />
        </Stack>
      </Grid>

      <Grid xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Key oral agents & steroids</Typography>
        <Stack spacing={1}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel control={<Checkbox checked={meds.metformin} onChange={e => setMeds(m => ({ ...m, metformin: e.target.checked }))} />} label="Metformin" />
            <TextField label="Notes / dose" value={meds.metforminNotes || ""} onChange={e => setMeds(m => ({ ...m, metforminNotes: e.target.value }))} sx={{ width: 300 }} />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel control={<Checkbox checked={meds.su} onChange={e => setMeds(m => ({ ...m, su: e.target.checked }))} />} label="Sulfonylurea" />
            <TextField label="Agent name" value={meds.suName} onChange={e => setMeds(m => ({ ...m, suName: e.target.value }))} sx={{ width: 200 }} />
            <TextField label="Dose (mg/day)" type="number" value={meds.suDose} onChange={e => setMeds(m => ({ ...m, suDose: e.target.value }))} sx={{ width: 160 }} />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel control={<Checkbox checked={meds.steroidAM} onChange={e => setMeds(m => ({ ...m, steroidAM: e.target.checked }))} />} label="Once-daily AM steroid" />
            <TextField label="Steroid dose / notes" value={meds.steroidNotes || ""} onChange={e => setMeds(m => ({ ...m, steroidNotes: e.target.value }))} sx={{ width: 300 }} />
          </Stack>
        </Stack>
      </Grid>

      <Grid xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Clinical context</Typography>
        <Grid container spacing={2}>
          <Grid xs={12} md={4}>
            <TextField
              label="eGFR (mL/min/1.73m²)"
              type="number"
              value={context.egfr}
              onChange={e => setContext(c => ({ ...c, egfr: e.target.value }))}
              fullWidth
            />
          </Grid>
          <Grid xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={context.npo} onChange={e => setContext(c => ({ ...c, npo: e.target.checked }))} />}
              label="Nil by mouth (NPO)"
            />
          </Grid>
          <Grid xs={12} md={4}>
            <TextField
              label="Weight (kg)"
              type="number"
              value={context.weightKg}
              onChange={e => setContext(c => ({ ...c, weightKg: e.target.value }))}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}