// src/pages/Community/CommunityPage.tsx  
import { Box, Grid, Typography } from "@mui/material";
import BeraberdeBuAy from "./BeraberdeBuAy";
import Topluluk from "./Topluluk";
import BeraberdeBuAyEnSon from "./BeraberdeBuAyEnSon";
import ToplulukEnSon from "./ToplulukEnSon";

export default function CommunityPage() {
  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh", p: { xs: 2.5, sm: 4 }, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Topluluk
      </Typography>

      <Grid container spacing={12} alignItems="flex-start">
        {/* SOL: ekleme kartları — md ve üstünde yan yana, mobilde alt alta */}
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, // ← yan yana
              alignItems: "start",
            }}
          >
            <BeraberdeBuAy />
            <Topluluk />
          </Box>
        </Grid>

        {/* SAĞ: en son eklenenler — üst üste */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: "grid",
              gap: 6,
              position: { md: "sticky" },
              top: { md: 24 },
            }}
          >
            <BeraberdeBuAyEnSon />
            <ToplulukEnSon />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
