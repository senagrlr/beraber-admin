// src/pages/Dashboard/SayilarBeraber.tsx
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { donationsService, usersService } from "@/data/container"; // ⬅️ usersService'i de al

type CountsState = {
  completedDonations: number;
  activeDonations: number;
  totalUsers: number;
};

export default function SayilarBeraber() {
  const [counts, setCounts] = useState<CountsState>({
    completedDonations: 0,
    activeDonations: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const nf = useMemo(
    () => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // donationsService içinden: { total, active, completed, photoPending } gelir
        const d = await donationsService.fetchDashboardCounts().catch(() => ({
          total: 0,
          active: 0,
          completed: 0,
          photoPending: 0,
        }));

        // usersService.getGlobalTotalUsers varsa kullan; yoksa 0
        const totalUsers = typeof (usersService as any).getGlobalTotalUsers === "function"
          ? await (usersService as any).getGlobalTotalUsers().catch(() => 0)
          : 0;

        if (!mounted) return;
        setCounts({
          completedDonations: Number(d.completed) || 0,
          activeDonations: Number(d.active) || 0,
          totalUsers: Number(totalUsers) || 0,
        });
      } catch (e) {
        console.error("Sayılar alınamadı:", e);
        if (!mounted) return;
        setCounts({ completedDonations: 0, activeDonations: 0, totalUsers: 0 });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    { line1: "Biten",      line2: "Bağışlar",  value: counts.completedDonations },
    { line1: "Devam Eden", line2: "Bağışlar",  value: counts.activeDonations },
    { line1: "Toplam",     line2: "Kullanıcı", value: counts.totalUsers },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Sayılarla Beraber
        </Typography>

        <Grid container spacing={4}>
          {items.map((it) => (
            <Grid item xs={12} md={4} key={it.line1 + it.line2}>
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
                  {loading ? "…" : nf.format(it.value)}
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
