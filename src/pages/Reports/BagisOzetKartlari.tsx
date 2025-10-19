import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { fetchMonthToDateTotal, fetchYearToDateTotal } from "../../services/donationsService";

const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);

export default function BagisOzetKartlari() {
  const thisYear = new Date().getFullYear();
  const [ytd, setYtd] = useState(0);
  const [mtd, setMtd] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [ytdVal, mtdVal] = await Promise.all([
        fetchYearToDateTotal(thisYear),
        fetchMonthToDateTotal(),
      ]);
      if (!alive) return;
      setYtd(ytdVal);
      setMtd(mtdVal);
    })();
    return () => { alive = false; };
  }, [thisYear]);

  return (
    <Box sx={{ display: "grid", gap: 7, alignContent: "start", mt: { xs: 2, md: 10 }, }}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: "#6A2A2B", color: "#fff", minHeight: 108, display: "grid", alignContent: "center" }}>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Yıllık Toplam Bağış(₺)</Typography>
        <Typography variant="h5" fontWeight={800}>{fmt(ytd)}</Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: "#6A2A2B", color: "#fff", minHeight: 108, display: "grid", alignContent: "center" }}>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Aylık Bağış (₺)</Typography>
        <Typography variant="h5" fontWeight={800}>{fmt(mtd)}</Typography>
      </Paper>
    </Box>
  );
}
