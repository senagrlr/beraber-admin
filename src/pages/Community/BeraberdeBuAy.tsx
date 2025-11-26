// src/pages/Community/BeraberdeBuAy.tsx
import { useMemo, useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNotifier } from "../../contexts/NotificationContext";
import { communityService } from "@/data/container"; // UI sadece servis kullanır
import { ALLOWED_IMAGE_MIME, IMAGE_MAX_BYTES } from "@/constants/validation";

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
};

export default function BeraberdeBuAy() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const notifier = useNotifier();

  // Seçilen dosya değiştikçe local preview URL’sini güncelle
  useEffect(() => {
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const isValid = useMemo(() => !!file && !uploadError, [file, uploadError]);

  const resetForm = () => {
    setFile(null);
    setFileName(null);
    setUploadError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0] ?? null;
    if (!f) return;
    setUploadError(null);

    if (!ALLOWED_IMAGE_MIME.includes(f.type as (typeof ALLOWED_IMAGE_MIME)[number])) {
      setUploadError("Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.");
      setFile(null);
      setFileName(null);
      return;
    }

    if (f.size > IMAGE_MAX_BYTES) {
      setUploadError("Dosya boyutu en fazla 5MB olabilir.");
      setFile(null);
      setFileName(null);
      return;
    }

    setFile(f);
    setFileName(f.name);
  };

  const onSave = async () => {
    if (!file || !isValid) {
      notifier.showWarning("Lütfen önce geçerli bir görsel seçin.");
      return;
    }
    try {
      setSaving(true);
      const key = monthKey();

      await communityService.addHighlightFile({
        monthKey: key,
        file,
      });

      resetForm();
      notifier.showSuccess("Fotoğraf kaydedildi.");
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

      <Button
        variant="outlined"
        component="label"
        disabled={saving}
        sx={{
          mb: 2,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        {fileName ? `Seçilen dosya: ${fileName}` : "Görsel ekle ( opsiyonel )"}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
      </Button>

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
          mb: uploadError ? 0.5 : 2,
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Bu Ay"
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
          />
        ) : (
          <Typography color="#6A2A2B" fontWeight={700} textAlign="center">
            Görsel ekle
            <br />
            <Typography component="span" color="#9f8e8a" fontSize={12}>
              Öneri: 500 × 500 piksel
            </Typography>
          </Typography>
        )}
      </Box>

      {!!uploadError && (
        <Typography sx={{ color: "#a33", fontSize: 12, mb: 2 }}>
          {uploadError}
        </Typography>
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
