// src/pages/reports/Reports.tsx
import { Box, Typography } from "@mui/material";
import BagisMiktariGrafik from "./BagisMiktariGrafik";
import BagisOzetKartlari from "./BagisOzetKartlari";

export default function Reports() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 3 }}>
      <BagisMiktariGrafik />
      <BagisOzetKartlari />
    </Box>
  );
}
