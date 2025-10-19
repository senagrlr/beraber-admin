import {
  Card,
  CardContent,
  Typography,
  Box,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchMonthlyUserCounts } from "../../services/userStatsService";

// TR kısaltmalar (grafikte sıra sabit kalsın)
const MONTHS_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

// Y ekseni üst sınırını veriye göre "güzel" bir sayıya yuvarla
function niceUpperBound(n: number) {
  if (n <= 0) return 100;
  const steps = [5, 10, 20, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  for (const s of steps) {
    const up = Math.ceil(n / s) * s;
    if (up >= n && up / s <= 10) return up; // en fazla 10 tick
  }
  return Math.ceil(n / 1000) * 1000;
}

export default function AylikKullanici() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [data, setData] = useState<{ month: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Dropdown'a 3 yıl koy (geçmiş/şimdiki/gelecek)
  const yearOptions = useMemo(
    () => [ thisYear, thisYear + 1],
    [thisYear]
  );

  // Boş/az veri durumunda kartın boş kalmaması için min 5 göster
  const emptyData = useMemo(
    () => MONTHS_TR.map((m) => ({ month: m, count: 0 })),
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rows = await fetchMonthlyUserCounts(year);
        if (!alive) return;

        // Gelen veriyi 12 aya oturt, eksik ayı 0 say ve min 5 uygula
        const map = new Map<string, number>();
        for (const r of rows) map.set(r.month, Number(r.count) || 0);

        const merged = MONTHS_TR.map((m) => {
          const raw = map.get(m) ?? 0;
          return { month: m, count: Math.max(raw, 5) };
        });

        setData(merged);
      } catch (e: any) {
        if (!alive) return;
        setErr("Aylık kullanıcı verileri alınamadı.");
        setData(emptyData);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [year, emptyData]);

  const displayData = data.length > 0 ? data : emptyData;
  const maxVal = useMemo(
    () => Math.max(0, ...displayData.map((d) => d.count)),
    [displayData]
  );
  const yMax = useMemo(() => niceUpperBound(maxVal), [maxVal]);

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        backgroundColor: "#FFFFFF",
        width: "100%",
        height: 360,
      }}
    >
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Başlık */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700} color="#5B3B3B">
            Aylık Kullanıcı
          </Typography>
          <Select
            value={year}
            size="small"
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{
              borderRadius: 2,
              backgroundColor: "#F8F8F8",
              color: "#5B3B3B",
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {err && (
          <Box mt={1}>
            <Alert severity="warning" sx={{ py: 0.5 }}>
              {err}
            </Alert>
          </Box>
        )}

        {/* Grafik */}
        <Box mt={2} sx={{ flexGrow: 1, width: "100%" }}>
          {loading ? (
            <Box height="100%" display="grid" sx={{ placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 20, left: 4, bottom: 10 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#eee" }}
                  tickLine={{ stroke: "#eee" }}
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#eee" }}
                  tickLine={{ stroke: "#eee" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(182,7,7,0.08)" }}
                  formatter={(v: any) => [v, "Kullanıcı"]}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#907777" radius={[6, 6, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
