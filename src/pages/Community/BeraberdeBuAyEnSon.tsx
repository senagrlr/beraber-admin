// src\pages\Community\BeraberdeBuAyEnSon.tsx
import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, IconButton,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Tooltip
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import {
  listenLatestHighlights,
  updateMonthlyHighlight,
  deleteHighlight,
  type BeraberdeDoc,
} from "../../services/communityService";
import { useNotifier } from "../../contexts/NotificationContext";

export default function BeraberdeBuAyEnSon() {
  const [rows, setRows] = useState<BeraberdeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const notifier = useNotifier();

  useEffect(() => {
    const unsub = listenLatestHighlights(10, (r) => {
      setRows(r);
      setLoading(false);
    });
    return () => { try { unsub?.(); } catch {} };
  }, []);

  const onEdit = (row: BeraberdeDoc) => {
    setEditId(row.id);
    setEditUrl(row.photoUrl ?? "");
    setOpen(true);
  };

  const onSave = async () => {
    if (!editId) return;
    try {
      await updateMonthlyHighlight(editId, { photoUrl: editUrl.trim() || undefined });
      setOpen(false);
      notifier.showSuccess("Görsel güncellendi.");
    } catch {
      notifier.showError("Görsel güncellenemedi.");
    }
  };

  const onDelete = async (id: string) => {
    const ok = await notifier.showConfirm("Silinsin mi?", "Bu görseli silmek istiyor musun?");
    if (!ok) return;
    try {
      await deleteHighlight(id);
      notifier.showSuccess("Görsel silindi.");
    } catch {
      notifier.showError("Görsel silinemedi.");
    }
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight={700}>Beraber’de Bu Ay (en son eklenenler)</Typography>
          {!loading && <Typography variant="body2" color="text.secondary">Toplam {rows.length}</Typography>}
        </Box>

        {loading && <Typography color="text.secondary">Yükleniyor…</Typography>}
        {!loading && rows.length === 0 && <Typography color="text.secondary">Henüz görsel yok.</Typography>}

        {!loading && rows.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 2 }}>
            {rows.map((r) => (
              <Box key={r.id} sx={{ position: "relative", borderRadius: 2, overflow: "hidden", background: "#f6f2f2", height: 140 }}>
                {r.photoUrl ? (
                  <img src={r.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Box sx={{ display: "grid", placeItems: "center", height: "100%", color: "text.secondary" }}>Foto yok</Box>
                )}

                <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 0.5 }}>
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
