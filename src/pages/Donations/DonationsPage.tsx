// src/pages/Donations/DonationsPage.tsx
import { Box, Typography } from "@mui/material";
import BagisEkle from "./BagisEkle";
import SonBagislar from "./SonBagislar";
import FotoEklenmesiGereken from "./FotoEklenmesiGereken";

export default function DonationsPage() {
  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh", p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Bağışlar
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 4, width: "100%" }}>
        {/* Sol: Yeni bağış formu */}
        <BagisEkle />

        {/* Sağ: listeler */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <SonBagislar />
          <FotoEklenmesiGereken />
        </Box>
      </Box>
    </Box>
  );
}
