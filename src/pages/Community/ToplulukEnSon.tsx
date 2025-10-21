// src\pages\Community\ToplulukEnSon.tsx
import { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, IconButton, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Avatar
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import {
  listenLastTopluluk,
  updateTopluluk,
  deleteTopluluk,
  type ToplulukDoc,
} from "../../services/communityService";
import { useNotifier } from "../../contexts/NotificationContext";

export default function ToplulukEnSon() {
  const [rows, setRows] = useState<ToplulukDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const notifier = useNotifier();

  useEffect(() => {
    const unsub = listenLastTopluluk(10, (r) => {
      setRows(r);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const onEdit = (r: ToplulukDoc) => {
    setEditId(r.id);
    setEditText(r.text ?? "");
    setEditUrl(r.photoUrl ?? "");
    setOpen(true);
  };

  const onSave = async () => {
    if (!editId) return;
    try {
      await updateTopluluk(editId, {
        text: editText.trim() || undefined,
        photoUrl: editUrl.trim() || undefined,
      });
      setOpen(false);
      notifier.showSuccess("Gönderi güncellendi.");
    } catch {
      notifier.showError("Gönderi güncellenemedi.");
    }
  };

  const onDelete = async (id: string) => {
    const ok = await notifier.showConfirm("Silinsin mi?", "Bu gönderiyi silmek istiyor musun?");
    if (!ok) return;
    try {
      await deleteTopluluk(id);
      notifier.showSuccess("Gönderi silindi.");
    } catch {
      notifier.showError("Gönderi silinemedi.");
    }
  };

  const short = (s?: string) => (s || "—").slice(0, 120);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight={700}>Topluluk (en son eklenenler)</Typography>
          {!loading && <Typography variant="body2" color="text.secondary">Toplam {rows.length}</Typography>}
        </Box>

        {loading && <Typography color="text.secondary">Yükleniyor…</Typography>}
        {!loading && rows.length === 0 && <Typography color="text.secondary">Henüz gönderi yok.</Typography>}

        {!loading && rows.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metin</TableCell>
                  <TableCell>Fotoğraf</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ maxWidth: 520 }}>{short(r.text)}</TableCell>
                    <TableCell>
                      {r.photoUrl ? (
                        <Avatar variant="rounded" src={r.photoUrl} sx={{ width: 56, height: 56 }} />
                      ) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => onEdit(r)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => onDelete(r.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Gönderiyi Düzenle</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Metin"
              multiline
              minRows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              fullWidth
            />
            <TextField
              label="Fotoğraf URL’si"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://…"
              fullWidth
            />
            {editUrl && (
              <Box sx={{ borderRadius: 2, overflow: "hidden", background: "#faf7f7", height: 180 }}>
                <img src={editUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
