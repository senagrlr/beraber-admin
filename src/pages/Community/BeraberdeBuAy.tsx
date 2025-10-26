// src/pages/Community/BeraberdeBuAy.tsx
import { useMemo, useState } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import { useNotifier } from "../../contexts/NotificationContext";
import { communityService } from "@/data/container"; // UI sadece servis kullanır

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
};

export default function BeraberdeBuAy() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [imgError, setImgError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const notifier = useNotifier();

  const trimmed = photoUrl.trim();
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  const previewOk = isHttpUrl && !imgError;
  const isValid = useMemo(() => isHttpUrl, [isHttpUrl]);

  const resetForm = () => {
    setPhotoUrl("");
    setImgError("");
  };

  const onSave = async () => {
    if (!isValid) {
      notifier.showWarning("Geçerli bir fotoğraf URL’si girin (https:// ile başlamalı).");
      return;
    }
    try {
      setSaving(true);
      const key = monthKey();
      // ÖNEMLİ: Artık overwrite etmiyoruz, her eklemede yeni belge oluşturuyoruz.
      await communityService.addHighlightUrl({
        monthKey: key,
        photoUrl: trimmed,
      });
      resetForm();
      notifier.showSuccess("Kaydedildi.");
    } catch (e) {
      console.error(e);
      notifier.showError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: "#E8E4E4", borderRadius: 3, p: 6 }}>
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
        Beraber’de Bu Ay
      </Typography>

      <TextField
        label="Fotoğraf URL'si"
        placeholder="https://…/gorsel.jpg"
        value={photoUrl}
        onChange={(e) => {
          setImgError("");
          setPhotoUrl(e.target.value);
        }}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          borderRadius: 4,
          border: "2px dashed #D1BDB7",
          backgroundColor: "#F3ECEA",
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          mb: imgError ? 0.5 : 2,
        }}
      >
        {previewOk ? (
          <img
            src={trimmed}
            alt="Bu Ay"
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
            onError={() => setImgError("Görsel yüklenemedi. URL’yi kontrol edin.")}
          />
        ) : (
          <Typography color="#6A2A2B" fontWeight={700} textAlign="center">
            Fotoğraf URL’si gir
            <br />
            <Typography component="span" color="#9f8e8a" fontSize={12}>
              500 × 500 piksel
            </Typography>
          </Typography>
        )}
      </Box>

      {!!imgError && (
        <Typography sx={{ color: "#a33", fontSize: 12, mb: 2 }}>{imgError}</Typography>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={onSave}
        disabled={saving || !isValid}
        sx={{
          mt: 6,
          px: 4,
          py: 1,
          borderRadius: 8,
          fontWeight: 700,
          mx: "auto",
          display: "block",
          backgroundColor: "#6A2A2B",
          ":hover": { backgroundColor: "#5B3B3B" },
          textTransform: "none",
        }}
      >
        {saving ? "Yükleniyor…" : "KAYDET"}
      </Button>
    </Box>
  );
}
