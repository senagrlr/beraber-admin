// src/pages/Notifications/NotificationsPage.tsx
import { Box, Typography } from "@mui/material";
import YeniBildirimEkle from "./YeniBildirimEkle";
import SonBildirimler from "./SonBildirimler";

export default function NotificationPage() {
  return (
    <Box sx={{ p: 4, width: "100%" }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="#5B3B3B">
        Bildirimler
      </Typography>

      <YeniBildirimEkle />
      <SonBildirimler />
    </Box>
  );
}
