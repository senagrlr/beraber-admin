// src\pages\Notifications\YeniBildirimEkle.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, Grid, Box, Typography, TextField,
  RadioGroup, FormControlLabel, Radio, MenuItem, Button
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { tr } from "date-fns/locale";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { createNotification, fetchCampaignOptions } from "../../services/notificationsService";
import type { NotificationTarget } from "../../services/notificationsService";

export default function YeniBildirimEkle() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [who, setWho] = useState<"all" | "campaign">("all");
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string }[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5); // varsayılan: 5 dk sonrası
    return d;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const rows = await fetchCampaignOptions();
      setCampaigns(rows);
    })();
  }, []);

  const titleCount = `${title.length}/50`;
  const bodyCount = `${body.length}/150`;

  const target: NotificationTarget | null = useMemo(() => {
    if (who === "all") return { type: "all" };
    const c = campaigns.find((x) => x.id === campaignId);
    if (!c) return null;
    return { type: "campaign", campaignId: c.id, campaignName: c.name };
  }, [who, campaignId, campaigns]);

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.length <= 50 &&
    body.length <= 150 &&
    scheduledAt &&
    (who === "all" || !!target);

  const onSubmit = async () => {
    if (!canSubmit || !scheduledAt || !target) return;
    setSaving(true);
    try {
      await createNotification({
        title: title.trim(),
        body: body.trim(),
        target,
        scheduledAt,
      });
      // formu temizle
      setTitle("");
      setBody("");
      setWho("all");
      setCampaignId("");
      const d = new Date();
      d.setMinutes(d.getMinutes() + 5);
      setScheduledAt(d);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3,  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",backgroundColor: "#E8E4E4", }}>
      <CardContent>
        <Grid container spacing={3}>
          {/* Sol taraf: başlık + içerik + kime */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Yeni Bildirim ekle
            </Typography>

            {/* Başlık */}
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography fontWeight={700}>Bildirim Adı</Typography>
                <Typography color="text.secondary">{titleCount}</Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="Örn: Kampanya Ödülü"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: 50 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, backgroundColor: "#fff" } }}
              />
            </Box>

            {/* İçerik */}
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography fontWeight={700}>Bildirim İçeriği</Typography>
                <Typography color="text.secondary">{bodyCount}</Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="Mesaj içeriğini yazın…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                inputProps={{ maxLength: 150 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, backgroundColor: "#fff" } }}
              />
            </Box>

            {/* Kime gidecek */}
            <Box>
              <RadioGroup
                row={false}
                value={who}
                onChange={(e) => setWho(e.target.value as any)}
              >
                <FormControlLabel value="all" control={<Radio />} label="Genel" />
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <FormControlLabel value="campaign" control={<Radio />} label="Kampanya Özel" />
                  <TextField
                    select
                    size="small"
                    disabled={who !== "campaign"}
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: "#fff" } }}
                    placeholder="Kampanyalar"
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
          </Grid>

          {/* Sağ taraf: tarih/saat + gönder */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Bildirimi planla
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DateTimePicker
                label="Gönderim zamanı"
                value={scheduledAt}
                onChange={(v) => setScheduledAt(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 3, backgroundColor: "#fff" } },
                  },
                }}
              />
            </LocalizationProvider>

            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={!canSubmit || saving}
              sx={{
                mt: 3,
                alignSelf: "flex-end",
                textTransform: "none",
                px: 4,
                py: 1.5,
                borderRadius: 6,
                backgroundColor: "#6A2A2B",
                ":hover": { backgroundColor: "#5B3B3B" },
                fontWeight: 700,
              }}
            >
              {saving ? "Kaydediliyor…" : "GÖNDER"}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
