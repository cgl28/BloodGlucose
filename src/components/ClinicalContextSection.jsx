// ClinicalContextSection.jsx
import React from 'react';
import {
  Stack, TextField, FormControlLabel, Checkbox, MenuItem, Box,
} from '@mui/material';

export default function ClinicalContextSection({ context, setContext }) {
  const update = (patch) => setContext({ ...context, ...patch });

  return (
    <Box>
      <Stack spacing={2}>
        <TextField
          label="Weight (kg)"
          type="number"
          value={context?.weight ?? ''}
          onChange={(e) => update({ weight: e.target.value })}
          fullWidth
        />
        <TextField
          label="eGFR (mL/min/1.73m²)"
          type="number"
          value={context?.egfr ?? ''}
          onChange={(e) => update({ egfr: e.target.value })}
          fullWidth
        />
        <TextField
          label="Carbohydrate intake"
          select
          value={context?.carbIntake ?? 'normal'}
          onChange={(e) => update({ carbIntake: e.target.value })}
          fullWidth
        >
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="reduced">Reduced</MenuItem>
          <MenuItem value="nil-by-mouth">Nil by mouth</MenuItem>
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!context?.steroid?.on}
              onChange={(e) => update({ steroid: { ...(context?.steroid||{}), on: e.target.checked } })}
            />
          }
          label="On systemic steroids"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!context?.infection}
              onChange={(e) => update({ infection: e.target.checked })}
            />
          }
          label="Active infection"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!context?.hypoRisk}
              onChange={(e) => update({ hypoRisk: e.target.checked })}
            />
          }
          label="High hypoglycaemia risk"
        />
      </Stack>
    </Box>
  );
}
