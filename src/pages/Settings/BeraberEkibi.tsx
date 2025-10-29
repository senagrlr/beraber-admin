import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box
} from "@mui/material";
import { container } from "@/data/container";
import type { TeamMember } from "@/data/repositories/team.repo";

export default function BeraberEkibi() {
  const teamService = container.get("teamService") as any;

  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const off = teamService.listenAll((list: TeamMember[]) => {
      if (!alive) return;

      const filtered = [...list]; // aktifleri listelemek istiyorsan: list.filter(x => x.active !== false)
      filtered.sort((a, b) => {
        const ad = a.createdAt?.toMillis?.() ?? 0;
        const bd = b.createdAt?.toMillis?.() ?? 0;
        return bd - ad; // newest first
      });

      setRows(filtered);
      setError(null);
      setLoading(false);
    }, 100);

    return () => { alive = false; off?.(); };
  }, [teamService]);

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
                  <TableCell>E-posta / Telefon</TableCell>
                  <TableCell>Roller</TableCell>
                  <TableCell>Aktif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.name || "—"}</TableCell>
                    <TableCell>
                      {(m.email || "—")}{m.email && m.phone ? " · " : ""}{m.phone || ""}
                    </TableCell>
                    <TableCell>{(m.roles || []).join(", ") || "—"}</TableCell>
                    <TableCell>{m.active ? "Evet" : "Hayır"}</TableCell>
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
