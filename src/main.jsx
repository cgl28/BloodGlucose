import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'                // your Tailwind file (keep it)
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#6a1b9a' },
  },
  // optional: typography, component defaults/overrides
})

// Ensure we only create one root across HMR reloads
const container = document.getElementById("root");
if (!window.__REACT_ROOT__) {
  window.__REACT_ROOT__ = ReactDOM.createRoot(container);
}
window.__REACT_ROOT__.render(<App />)

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
