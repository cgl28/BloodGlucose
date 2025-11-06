import React, { useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Typography, Divider
} from '@mui/material'

// tiny pretty-printer
function Code({ obj }) {
  return (
    <pre style={{
      margin: 0, padding: 12, background: '#f7f7f8',
      border: '1px solid #eee', borderRadius: 8, overflowX: 'auto'
    }}>
      {JSON.stringify(obj, null, 2)}
    </pre>
  )
}

export default function DataCheckerDialog({
  open, onClose,
  modelInput, // { lookbackHrs, diabetesType, readingsUsed, stats, insulinMeds, context, ruleVersion }
}) {
  const [tab, setTab] = React.useState(0)

  const tabs = [
    { label: 'Overview', key: 'overview' },
    { label: 'Readings used', key: 'readings' },
    { label: 'Medications', key: 'meds' },
    { label: 'Context & labs', key: 'context' },
    { label: 'Computed stats', key: 'stats' },
  ]

  const overview = useMemo(() => ({
    diabetesType: modelInput.diabetesType,
    lookbackHrs: modelInput.lookbackHrs,
    ruleVersion: modelInput.ruleVersion,
    counts: {
      readingsUsed: modelInput.readingsUsed?.length ?? 0,
      insulinEntries: modelInput.insulinMeds?.length ?? 0,
    }
  }), [modelInput])

  function handleCopy() {
    const blob = JSON.stringify(modelInput, null, 2)
    navigator.clipboard?.writeText(blob)
  }
  function handleDownload() {
    const blob = new Blob([JSON.stringify(modelInput, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data-checker.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Data checker — inputs used for recommendations</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          {tabs.map((t, i) => <Tab key={t.key} label={t.label} />)}
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Everything below is the exact data passed to the rules engine for this patient/session.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Code obj={overview} />
          </Box>
        )}

        {tab === 1 && <Code obj={modelInput.readingsUsed} />}
        {tab === 2 && <Code obj={{ insulinMeds: modelInput.insulinMeds, oralsSteroids: {
          metformin: modelInput.context?.metformin,
          metforminDose: modelInput.context?.metforminDose,
          su: modelInput.context?.su,
          suName: modelInput.context?.suName,
          suDose: modelInput.context?.suDose,
          steroid: modelInput.context?.steroid,
        }}} />}
        {tab === 3 && <Code obj={{
          egfr: modelInput.context?.egfr,
          npo: modelInput.context?.npo,
          weightKg: modelInput.context?.weightKg,
          albumin: modelInput.context?.albumin,
          diabetesType: modelInput.diabetesType
        }} />}
        {tab === 4 && <Code obj={modelInput.stats} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy}>Copy JSON</Button>
        <Button onClick={handleDownload}>Download JSON</Button>
        <Button variant="contained" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
