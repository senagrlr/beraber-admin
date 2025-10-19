// src/pages/settings/SettingsPage.tsx
import { Box, Grid, Typography } from "@mui/material";
import KullaniciBilgisi from "./KullaniciBilgisi";
import BeraberEkibi from "./BeraberEkibi";

export default function SettingsPage() {
  return (
    <Box sx={{ p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">Ayarlar</Typography>

      <Grid container spacing={12}>
        <Grid item xs={12} md={5}>
          <KullaniciBilgisi />
        </Grid>
        <Grid item xs={12} md={7}>
          <BeraberEkibi />
        </Grid>
      </Grid>
    </Box>
  );
}
