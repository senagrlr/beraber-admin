// src/pages/Reports/BagisMiktariGrafik.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { donationsService } from "@/data/container"; // ⬅️ container üzerinden servis

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

/** Y ekseni üst sınırını binlik/milyonluk güzel adımlara yuvarla */
function niceUpperBound(n: number) {
  if (n <= 0) return 1000;
  const steps = [
    1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
    250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000
  ];
  for (const s of steps) {
    const up = Math.ceil(n / s) * s;
    if (up >= n && up / s <= 10) return up;
  }
  return Math.ceil(n / 1_000_000) * 1_000_000;
}

/** 1234 -> 1.2k, 2_000_000 -> 2M */
function compact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return String(n);
}

export default function BagisMiktariGrafik() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const yearOptions = useMemo(() => [thisYear, thisYear + 1], [thisYear]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // ⬇️ container servisinden al
        const data = await donationsService.fetchMonthlyDonationSums(year);
        if (!alive) return;
        setRows(data);
      } catch {
        if (!alive) return;
        setErr("Bağış verileri alınamadı.");
        setRows(MONTHS_TR.map((m) => ({ month: m, total: 0 })));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [year]);

  const maxVal = useMemo(() => Math.max(0, ...rows.map((r) => r.total)), [rows]);
  const yMax = useMemo(() => niceUpperBound(maxVal), [maxVal]);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", backgroundColor: "#FFFFFF", height: 420 }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700} color="#5B3B3B">Bağış Miktarı</Typography>
          <Select
            value={year}
            size="small"
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ borderRadius: 2, backgroundColor: "#F8F8F8", color: "#5B3B3B", fontWeight: 600, minWidth: 100 }}
          >
            {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>

        {err && <Box mt={1}><Alert severity="warning" sx={{ py: 0.5 }}>{err}</Alert></Box>}

        <Box mt={2} sx={{ flexGrow: 1 }}>
          {loading ? (
            <Box height="100%" display="grid" sx={{ placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 20, left: 4, bottom: 10 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={{ stroke: "#eee" }} tickLine={{ stroke: "#eee" }} />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#eee" }}
                  tickLine={{ stroke: "#eee" }}
                  tickFormatter={(v) => compact(Number(v))}
                />
                <Tooltip
                  cursor={{ fill: "rgba(182,7,7,0.08)" }}
                  formatter={(v: any) => [fmtMoney(Number(v)), "Toplam (₺)"]}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="total" fill="#B77777" radius={[6, 6, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
