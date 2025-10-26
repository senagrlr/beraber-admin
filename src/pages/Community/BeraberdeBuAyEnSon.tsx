// src/pages/Community/BeraberdeBuAyEnSon.tsx
import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, IconButton,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Tooltip
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { communityService } from "@/data/container";
import type { Highlight } from "@/domain/community/post.types";

export default function BeraberdeBuAyEnSon() {
  const [rows, setRows] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    // Sadece SON 10 kayıt
    const unsub = communityService.listenLatestHighlights(10, (r) => {
      setRows(r);
      setLoading(false);
    });
    return () => { try { unsub?.(); } catch {} };
  }, []);

  const onEdit = (row: Highlight) => {
    setEditId(row.id);
    setEditUrl(row.photoUrl ?? "");
    setOpen(true);
  };

  const onSave = async () => {
    if (!editId) return;
    await communityService.updateMonthlyHighlight(editId, { photoUrl: editUrl.trim() || undefined });
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    await communityService.deleteHighlight(id);
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>Beraber’de Bu Ay (en son eklenenler)</Typography>
          {!loading && <Typography variant="body2" color="text.secondary">Toplam {rows.length}</Typography>}
        </Box>

        {loading && <Typography color="text.secondary">Yükleniyor…</Typography>}
        {!loading && rows.length === 0 && <Typography color="text.secondary">Henüz görsel yok.</Typography>}

        {!loading && rows.length > 0 && (
          // SABİT YÜKSEKLİK + YATAY SCROLL
          <Box
            sx={{
              position: "relative",
              height: 180,                // <-- Kartın yüksekliği sabit
              overflow: "hidden",         // dışarı taşma yok
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexWrap: "nowrap",       // <-- tek satır, alt satıra düşme yok
                gap: 2,
                overflowX: "auto",
                overflowY: "hidden",
                alignItems: "center",
                px: 0.5,
                scrollSnapType: "x proximity",
                "&::-webkit-scrollbar": { height: 8 },
                "&::-webkit-scrollbar-thumb": { borderRadius: 8, background: "rgba(0,0,0,0.15)" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
              }}
            >
              {rows.map((r) => (
                <Box
                  key={String(r.id)}
                  sx={{
                    position: "relative",
                    flex: "0 0 auto",
                    width: 160,
                    height: 160,
                    borderRadius: 2,
                    overflow: "hidden",
                    background: "#f6f2f2",
                    scrollSnapAlign: "start",
                  }}
                >
                  {r.photoUrl ? (
                    <img
                      src={r.photoUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <Box sx={{ display: "grid", placeItems: "center", height: "100%", color: "text.secondary" }}>
                      Foto yok
                    </Box>
                  )}

                  <Box sx={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 0.5 }}>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" onClick={() => onEdit(r)} sx={{ bgcolor: "white" }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton size="small" onClick={() => onDelete(r.id)} sx={{ bgcolor: "white" }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Görseli Düzenle</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Fotoğraf URL’si"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              fullWidth
              placeholder="https://…"
            />
            {editUrl && (
              <Box sx={{ borderRadius: 2, overflow: "hidden", background: "#faf7f7", height: 180 }}>
                <img src={editUrl} alt="Önizleme" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button variant="contained" onClick={onSave}>Kaydet</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
