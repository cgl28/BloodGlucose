import React from "react";
import {
  Grid, Typography, Stack, FormControlLabel, Checkbox, TextField, Paper, Button, MenuItem, IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const ACTING_OPTS = [
  { value: 'rapid', label: 'Rapid' },
  { value: 'short', label: 'Short' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'long', label: 'Long' },
  { value: 'premix', label: 'Premix' },
];

export default function MedicationSection({
  insulinMeds, setInsulinMeds,
  context, setContext,
}) {
  // handlers for insulin list
  const addInsulin = () => {
    setInsulinMeds(prev => [...prev, { id: crypto.randomUUID(), name: "", acting: "long", doseUnits: "", time: "" }]);
  };
  const updateInsulin = (id, patch) => {
    setInsulinMeds(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };
  const removeInsulin = (id) => {
    setInsulinMeds(prev => prev.filter(m => m.id !== id));
  };

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {/* INSULIN REGIMEN */}
      <Grid xs={12}>
        <Paper elevation={0} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Insulin regimen</Typography>

          {insulinMeds.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No insulin added yet.
            </Typography>
          )}

          <Stack spacing={1.5}>
            {insulinMeds.map((m) => (
              <Grid container spacing={1} alignItems="center" key={m.id}>
                <Grid xs={12} md={3}>
                  <TextField
                    label="Insulin name"
                    value={m.name}
                    onChange={e => updateInsulin(m.id, { name: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid xs={12} md={3}>
                  <TextField
                    label="Type"
                    select
                    value={m.acting}
                    onChange={e => updateInsulin(m.id, { acting: e.target.value })}
                    fullWidth
                  >
                    {ACTING_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid xs={6} md={2}>
                  <TextField
                    label="Dose (units)"
                    type="number"
                    value={m.doseUnits}
                    onChange={e => updateInsulin(m.id, { doseUnits: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid xs={6} md={2}>
                  <TextField
                    label="Time (HH:mm)"
                    placeholder="22:00"
                    value={m.time}
                    onChange={e => updateInsulin(m.id, { time: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid xs={12} md={2}>
                  <IconButton color="error" onClick={() => removeInsulin(m.id)} aria-label="Remove insulin">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={addInsulin}>
            Add medication
          </Button>
        </Paper>
      </Grid>

      {/* CLINICAL CONTEXT */}
      <Grid xs={12}>
        <Paper elevation={0} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Clinical context</Typography>

          {/* Metformin + SU */}
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid xs={12} md={3}>
              <FormControlLabel
                control={<Checkbox checked={context.metformin} onChange={e => setContext(c => ({ ...c, metformin: e.target.checked }))} />}
                label="Metformin"
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                label="Metformin dose (mg/day)"
                type="number"
                value={context.metforminDose || ""}
                onChange={e => setContext(c => ({ ...c, metforminDose: e.target.value }))}
                fullWidth
              />
            </Grid>

            <Grid xs={12} md={3}>
              <FormControlLabel
                control={<Checkbox checked={context.su} onChange={e => setContext(c => ({ ...c, su: e.target.checked }))} />}
                label="Sulfonylurea"
              />
            </Grid>
            <Grid xs={6} md={1.5}>
              <TextField
                label="SU name"
                value={context.suName || ""}
                onChange={e => setContext(c => ({ ...c, suName: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={1.5}>
              <TextField
                label="SU dose (mg/day)"
                type="number"
                value={context.suDose || ""}
                onChange={e => setContext(c => ({ ...c, suDose: e.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Steroids */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Steroid therapy</Typography>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid xs={12} md={2.5}>
              <FormControlLabel
                control={<Checkbox checked={context.steroid?.on || false} onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), on: e.target.checked } }))} />}
                label="On steroids"
              />
            </Grid>
            <Grid xs={12} md={2.5}>
              <TextField
                label="Type"
                placeholder="Prednisolone"
                value={context.steroid?.type || ""}
                onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), type: e.target.value } }))}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={2}>
              <TextField
                label="Route"
                select
                value={context.steroid?.route || "oral"}
                onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), route: e.target.value } }))}
                fullWidth
              >
                <MenuItem value="oral">Oral</MenuItem>
                <MenuItem value="iv">IV</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={6} md={1.5}>
              <TextField
                label="Dose"
                value={context.steroid?.dose || ""}
                onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), dose: e.target.value } }))}
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={2}>
              <TextField
                label="Timing"
                placeholder="e.g. 08:00"
                value={context.steroid?.time || ""}
                onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), time: e.target.value } }))}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={2}>
              <TextField
                label="Duration"
                placeholder="e.g. 7 days"
                value={context.steroid?.duration || ""}
                onChange={e => setContext(c => ({ ...c, steroid: { ...(c.steroid||{}), duration: e.target.value } }))}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Labs / status */}
          <Grid container spacing={2}>
            <Grid xs={12} md={3}>
              <TextField
                label="eGFR (mL/min/1.73m²)"
                type="number"
                value={context.egfr}
                onChange={e => setContext(c => ({ ...c, egfr: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                control={<Checkbox checked={context.npo} onChange={e => setContext(c => ({ ...c, npo: e.target.checked }))} />}
                label="Nil by mouth (NPO)"
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                label="Weight (kg)"
                type="number"
                value={context.weightKg}
                onChange={e => setContext(c => ({ ...c, weightKg: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                label="Albumin (g/L)"
                type="number"
                value={context.albumin || ""}
                onChange={e => setContext(c => ({ ...c, albumin: e.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
