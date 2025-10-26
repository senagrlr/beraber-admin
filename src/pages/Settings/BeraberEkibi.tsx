// src/pages/Settings/BeraberEkibi.tsx
import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box
} from "@mui/material";
import { teamsService } from "@/data/container";

type TeamMember = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  order?: number;
  active?: boolean;
};

export default function BeraberEkibi() {
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Realtime liste — servis imzası: listenAll(cb, limitN?)
    const off = teamsService.listenAll((list) => {
      if (!alive) return;

      // sadece aktifleri istiyorsan yorum satırını aç:
      // const filtered = list.filter(x => x.active !== false);
      const filtered = [...list];

      // sırala: önce order (yoksa sonsuz), eşitse isme göre
      filtered.sort((a, b) => {
        const ao = a.order ?? Number.POSITIVE_INFINITY;
        const bo = b.order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return (a.name ?? "").localeCompare(b.name ?? "", "tr");
      });

      setRows(filtered);
      setError(null);
      setLoading(false);
    }, 50); // istersen limit artır/azalt

    return () => {
      alive = false;
      off?.();
    };
  }, []);

  const isEmpty = !loading && !error && rows.length === 0;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight={700}>Beraber Ekibi</Typography>
          {!loading && !error && rows.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Toplam {rows.length} kişi
            </Typography>
          )}
        </Box>

        {loading && <Typography color="text.secondary">Yükleniyor…</Typography>}
        {!loading && error && <Typography color="error">{error}</Typography>}
        {isEmpty && <Typography color="text.secondary">Henüz ekip üyesi eklenmemiş.</Typography>}

        {!loading && !error && rows.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>İsim</TableCell>
                  <TableCell>İletişim</TableCell>
                  <TableCell>Rol</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.name || "—"}</TableCell>
                    <TableCell>
                      {(m.email || "—")}{m.email && m.phone ? " · " : ""}{m.phone || ""}
                    </TableCell>
                    <TableCell>{m.role || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
