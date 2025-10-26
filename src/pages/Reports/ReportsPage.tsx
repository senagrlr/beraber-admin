// src/pages/Reports/ReportsPage.tsx
import { Box, Typography } from "@mui/material";
import BagisMiktariGrafik from "./BagisMiktariGrafik";
import BagisOzetKartlari from "./BagisOzetKartlari";

export default function ReportsPage() {
  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh", p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Raporlar
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 320px" },
          alignItems: "start",
        }}
      >
        <BagisMiktariGrafik />
        <BagisOzetKartlari />
      </Box>
    </Box>
  );
}
