import React from "react";
import { Stack, Box, Typography } from "@mui/material";

export default function SectionHeader({ icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{
        width: 36, height: 36, borderRadius: 1,
        display: "grid", placeItems: "center",
        bgcolor: "primary.main", color: "primary.contrastText"
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Stack>
  );
}