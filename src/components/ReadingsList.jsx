import React from "react";
import { Stack, Box, TextField, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

function asNumber(x) { const n = Number(x); return Number.isFinite(n) ? n : null; }

export default function ReadingsList({ readings, setReadings, addRow, clearRows }) {
  return (
    <Box sx={{ mt: 1 }}>
      {readings.map((r, i) => {
        const valueErr = r.value !== "" && asNumber(r.value) == null;
        return (
          <Stack key={r.id} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField
              label="Timestamp"
              type="datetime-local"
              value={r.ts}
              onChange={e => setReadings(prev => prev.map(x => x.id === r.id ? { ...x, ts: e.target.value } : x))}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 280 }}
            />
            <TextField
              label="BG (mmol/L)"
              type="number"
              inputProps={{ step: "0.1", min: "0" }}
              value={r.value}
              onChange={e => setReadings(prev => prev.map(x => x.id === r.id ? { ...x, value: e.target.value } : x))}
              error={valueErr}
              helperText={valueErr ? "Enter a number" : ""}
              sx={{ width: 160 }}
            />
            <Button variant="outlined" color="error" onClick={() => setReadings(prev => prev.filter(x => x.id !== r.id))}>Remove</Button>
            {i === readings.length - 1 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => addRow(true)}>Add Now</Button>
            )}
          </Stack>
        );
      })}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button variant="text" onClick={() => addRow(false)}>Add empty row</Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => clearRows()}>Clear all</Button>
      </Stack>
    </Box>
  );
}