// src/pages/Donations/DonationsPage.tsx
import { Box, Typography, Grid, Stack } from "@mui/material";
import BagisEkle from "./BagisEkle";
import SonBagislar from "./SonBagislar";
import FotoEklenmesiGereken from "./FotoEklenmesiGereken";

export default function DonationsPage() {
  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh", p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Bağışlar
      </Typography>

      <Grid container spacing={4}>
        {/* Sol: Yeni bağış formu */}
        <Grid item xs={12} md={5}>
          <BagisEkle />
        </Grid>

        {/* Sağ: listeler */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <SonBagislar />
            <FotoEklenmesiGereken />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
