// src/pages/Dashboard/DashboardPage.tsx
import { Box, Grid, Typography } from "@mui/material";
import YapilacaklarListesi from "./YapilacaklarListesi";
import AylikKullanici from "./AylikKullanici";
import BagisKategoriOrani from "./BagisKategoriOrani";
import SayilarBeraber from "./SayilarBeraber";
import BitenBagisKampanyalari from "./BitenBagisKampanyalari";

export default function DashboardPage() {
  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh", p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Dashboard
      </Typography>

      {/* ÜST SATIR */}
      <Grid
        container
        spacing={3}
        mb={3}
        wrap="nowrap"
        sx={{ width: "100%" }}
      >
        <Grid item xs={12} md={4} sx={{ flex: "0 0 30%", minWidth: 350 }}>
          <YapilacaklarListesi />
        </Grid>

        <Grid item xs={12} md={8} sx={{ flex: "1 1 auto", width: "100%" }}>
          <AylikKullanici />
        </Grid>
      </Grid>

      {/* ALT SATIR */}
      <Grid
        container
        spacing={5}
        wrap="nowrap"
        sx={{ width: "100%" }}
      >
        <Grid item xs={12} md={4} sx={{ flex: "0 0 30%", minWidth: 350 }}>
          <BagisKategoriOrani />
        </Grid>

        <Grid item xs={12} md={4} sx={{ flex: "0 0 30%", minWidth: 350 }}>
          <BitenBagisKampanyalari />
        </Grid>

        <Grid item xs={12} md={4} sx={{ flex: "0 0 35%", minWidth: 350 }}>
          <SayilarBeraber />
        </Grid>
      </Grid>
    </Box>
  );
}
