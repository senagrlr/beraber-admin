// src/pages/Notifications/SonBildirimler.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Card, CardContent, Typography, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, RadioGroup, FormControlLabel, Radio, MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { notificationsService } from "@/data/container";

/** UI’da ihtiyaç duyduğumuz minimal tip */
type NotificationTarget =
  | { type: "all" }
  | { type: "campaign"; campaignId: string; campaignName?: string };

type UINotification = {
  id: string;
  title: string;
  body: string;
  target: NotificationTarget;
  scheduledAt?: any; // Firestore Timestamp | Date
};

export default function SonBildirimler() {
  const [rows, setRows] = useState<UINotification[]>([]);
  const [cursor, setCursor] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string }[]>([]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const mountedOnce = useRef(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editWho, setEditWho] = useState<"all" | "campaign">("all");
  const [editCampaignId, setEditCampaignId] = useState("");

  // kampanya seçenekleri
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cs = await notificationsService.fetchCampaignOptions();
        if (alive) setCampaigns(cs);
      } catch {
        // sessiz düş
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // realtime (son 20) — StrictMode çift mount korumalı
  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    const off = notificationsService.listenRecent(20, (live) => {
      setRows((prev) => {
        const map = new Map<string, UINotification>();
        for (const it of live as UINotification[]) map.set(it.id, it);
        for (const it of prev) if (!map.has(it.id)) map.set(it.id, it);
        return Array.from(map.values());
      });
    });

    // yeni oluşturulanda üstte göster (container.events varsa)
    const createdHandler = async (ev: Event) => {
      const id = (ev as CustomEvent).detail?.id as string | undefined;
      setCursor(undefined);
      setHasMore(true);
      setError(null);
      if (id) {
        try {
          const doc = await notificationsService.getById(id);
          if (doc) {
            setRows((prev) => (prev.find((x) => x.id === id) ? prev : [doc as UINotification, ...prev]));
          }
        } catch {}
      }
    };
    notificationsService.events?.addEventListener?.("created", createdHandler as EventListener);

    return () => {
      off?.();
      notificationsService.events?.removeEventListener?.("created", createdHandler as EventListener);
      mountedOnce.current = false;
    };
  }, []);

  // sayfalı yükleme
  const load = useCallback(async () => {
    if (loading || !hasMore || !!error) return;
    setLoading(true);
    try {
      const { items, cursor: c } = await notificationsService.fetchPage(20, cursor);
      setRows((r) => {
        const map = new Map<string, UINotification>();
        for (const it of r) map.set(it.id, it);
        for (const it of items as UINotification[]) map.set(it.id, it);
        return Array.from(map.values());
      });
      setCursor(c);
      if ((!items || items.length === 0) && !c) setHasMore(false);
    } catch (e) {
      console.error("[SonBildirimler] load ERROR:", e);
      setError("Bildirimleri okuma izni yok veya erişim engellendi.");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [cursor, error, hasMore, loading]);

  useEffect(() => {
    void load();
  }, [load]);

  // sonsuz kaydırma
  useEffect(() => {
    if (error || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void load();
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [error, hasMore, load]);

  const formatType = (t: NotificationTarget) =>
    t.type === "all" ? "Genel" : `Kampanya Özel — ${t.campaignName || t.campaignId}`;

  const openEdit = (row: UINotification) => {
    setEditId(row.id);
    setEditTitle(row.title);
    setEditBody(row.body);
    if (row.target.type === "all") {
      setEditWho("all");
      setEditCampaignId("");
    } else {
      setEditWho("campaign");
      setEditCampaignId(row.target.campaignId);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editId) return;
    const target: NotificationTarget =
      editWho === "all"
        ? { type: "all" }
        : {
            type: "campaign",
            campaignId: editCampaignId,
            campaignName: campaigns.find((c) => c.id === editCampaignId)?.name || "",
          };

    await notificationsService.update(editId, {
      title: editTitle.trim(),
      body: editBody.trim(),
      target,
    });

    setRows((r) =>
      r.map((x) =>
        x.id === editId ? { ...x, title: editTitle.trim(), body: editBody.trim(), target } : x
      )
    );
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await notificationsService.delete(id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", mt: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Son Bildirimler
        </Typography>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>İçerik</TableCell>
                <TableCell>Tür</TableCell>
                <TableCell>Planlanan Zaman</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography fontWeight={700}>{row.title}</Typography>
                    <Typography color="text.secondary" noWrap>
                      {row.body}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatType(row.target)}</TableCell>
                  <TableCell>
                    {row.scheduledAt?.toDate ? row.scheduledAt.toDate().toLocaleString("tr-TR") : "-"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(row.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4}>
                  <Box ref={sentinelRef} sx={{ height: 1 }} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && rows.length === 0 && !error && (
          <Typography mt={2} color="text.secondary">
            Henüz bildirim yok.
          </Typography>
        )}
        {loading && (
          <Typography mt={2} color="text.secondary">
            Yükleniyor…
          </Typography>
        )}
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Bildirim Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            label="Başlık"
            fullWidth
            sx={{ mt: 1.5 }}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="İçerik"
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 2 }}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            inputProps={{ maxLength: 150 }}
          />
          <Box sx={{ mt: 2 }}>
            <RadioGroup value={editWho} onChange={(e) => setEditWho(e.target.value as any)}>
              <FormControlLabel value="all" control={<Radio />} label="Genel" />
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <FormControlLabel value="campaign" control={<Radio />} label="Kampanya Özel" />
                <TextField
                  select
                  size="small"
                  disabled={editWho !== "campaign"}
                  value={editCampaignId}
                  onChange={(e) => setEditCampaignId(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  {campaigns.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} {c.status ? `(${c.status})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Vazgeç</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: "none", fontWeight: 700 }}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
