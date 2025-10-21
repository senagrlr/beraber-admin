// src\pages\Dashboard\SayilarBeraber.tsx
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchDashboardCounts } from "../../services/donationsService";

export default function SayilarBeraber() {
  const [counts, setCounts] = useState({
    completedDonations: 0,
    activeDonations: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDashboardCounts();
        if (mounted) setCounts(data);
      } catch (e) {
        console.error("Sayılar alınamadı:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Sabit başlıklar (iki satır) — Hepsi 700 ağırlık
  const items = [
    { line1: "Biten",      line2: "Bağışlar",   value: counts.completedDonations },
    { line1: "Devam Eden", line2: "Bağışlar",   value: counts.activeDonations },
    { line1: "Toplam",     line2: "Kullanıcı",  value: counts.totalUsers },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Sayılarla Beraber
        </Typography>

        <Grid container spacing={4}>
          {items.map((it) => (
            <Grid item xs={10} key={it.line1 + it.line2}>
              <Box
                sx={{
                  backgroundColor: "#6A2A2B",
                  borderRadius: 2,
                  py: 2,
                  px: 2,
                  textAlign: "center",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 110,
                }}
              >
                <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>
                  {loading ? "…" : it.value}
                </Typography>

                <Box sx={{ mt: 0.5, lineHeight: 1.1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {it.line1}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {it.line2}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
