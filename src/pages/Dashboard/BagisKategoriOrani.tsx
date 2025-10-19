import { Card, CardContent, Typography, Box } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { fetchCategoryRatios } from "../../services/donationsService";

type PieDatum = { name: string; value: number; color: string };

export default function BagisKategoriOrani() {
  const [data, setData] = useState<PieDatum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ratios = await fetchCategoryRatios();
        if (mounted) setData(ratios);
      } catch (e) {
        console.error("Kategori oranları yüklenemedi:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600}>
          Bağış Kategori Oranı
        </Typography>
        <Typography color="gray" fontSize={14} mb={2}>
          30 günlük veriler baz alınmıştır.
        </Typography>

        <Box height={200}>
          {loading ? (
            <Typography textAlign="center" color="gray">
              Yükleniyor...
            </Typography>
          ) : data.length === 0 ? (
            <Typography textAlign="center" color="gray">
              Henüz yeterince veri bulunmuyor.
            </Typography>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
