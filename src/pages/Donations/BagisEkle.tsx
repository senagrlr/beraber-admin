// src/pages/Donations/BagisEkle.tsx
import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { donationsService, auth } from "@/data/container";
import { useNotifier } from "../../contexts/NotificationContext";
import { DONATION_CATEGORIES } from "@/domain/donations/donation.schema";
import { ALLOWED_IMAGE_MIME, IMAGE_MAX_BYTES } from "@/constants/validation";

type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number];

export default function BagisEkle() {
  const [donationName, setDonationName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");

  // Dosya + preview
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const [imgError, setImgError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const notifier = useNotifier();

  // ObjectURL temizliği
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isValid = useMemo(() => {
    const nm = donationName.trim();
    const amt = Number(amount);
    return nm.length >= 3 && !!category && Number.isFinite(amt) && amt > 0;
  }, [donationName, category, amount]);

  const resetForm = () => {
    setDonationName("");
    setCategory("");
    setAmount("");
    setText("");
    setFile(null);
    setPreviewUrl("");
    setSelectedFileName("");
    setImgError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setPreviewUrl("");
      setSelectedFileName("");
      setImgError("");
      return;
    }

    // MIME kontrolü
    const mime = f.type as AllowedMime;
    if (!ALLOWED_IMAGE_MIME.includes(mime)) {
      setImgError("Sadece JPG, PNG veya WEBP görsel yükleyebilirsin.");
      setFile(null);
      setPreviewUrl("");
      setSelectedFileName("");
      return;
    }

    // Boyut kontrolü
    if (f.size > IMAGE_MAX_BYTES) {
      const mb = (IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(1);
      setImgError(`Görsel en fazla ${mb} MB olabilir.`);
      setFile(null);
      setPreviewUrl("");
      setSelectedFileName("");
      return;
    }

    // Her yeni seçimde eski preview URL'ini temizle
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setSelectedFileName(f.name);
    setImgError("");
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleAddDonation = async () => {
    if (!isValid) {
      notifier.showWarning(
        "Lütfen tüm zorunlu alanları (İsim en az 3 karakter) geçerli şekilde doldurun."
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      notifier.showError("Oturumunuzun süresi dolmuş. Lütfen yeniden giriş yapın.");
      return;
    }

    try {
      setSaving(true);

      // 1) Bağışı kaydet (fotoğrafsız)
      const { id } = await donationsService.create(
        {
          name: donationName.trim(),
          category,
          amount: Number(amount),
          description: text.trim(),
        },
        user.uid
      );

      // 2) Dosya seçildiyse Storage'a yükle ve photoUrl alanını doldur
      if (file) {
        await donationsService.uploadPhoto(id, file);
      }

      resetForm();
      notifier.showSuccess("Bağış başarıyla eklendi!");
    } catch (err: any) {
      console.error("Bağış ekleme hatası:", err);
      const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
      notifier.showError(`Bağış eklenemedi: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 5,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        backgroundColor: "#E8E4E4",
        p: 3,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
          Yeni Bağış Ekle
        </Typography>

        {/* Dosya seçimi */}
        <Box sx={{ mb: 1.5 }}>
          <Button
            variant="outlined"
            component="label"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 3,
              mb: 1,
            }}
          >
            Görsel Seç
            <input type="file" accept={ALLOWED_IMAGE_MIME.join(",")} hidden onChange={handleFileChange} />
          </Button>

          <Typography variant="body2" sx={{ color: "#5B3B3B" }}>
            {selectedFileName ? `Seçilen dosya: ${selectedFileName}` : "Henüz dosya seçilmedi."}
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: 4,
            border: "6px dashed #DCBCBC",
            backgroundColor: "#F3ECEA",
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            mb: 2,
            color: "#680C0C",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Bağış görseli"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
            />
          ) : (
            <Typography color="#6A2A2B" fontWeight={700} textAlign="center">
              Görsel seç (opsiyonel)
              <br />
              <Typography component="span" variant="body2" color="gray">
                Örn: JPG, PNG veya WEBP
              </Typography>
            </Typography>
          )}
        </Box>

        {!!imgError && (
          <Typography sx={{ color: "#a33", fontSize: 12, mt: -1, mb: 1.5 }}>{imgError}</Typography>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="kategori-label">Kategori seç</InputLabel>
          <Select
            labelId="kategori-label"
            value={category}
            label="Kategori seç"
            onChange={(e) => setCategory(e.target.value)}
          >
            {DONATION_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Bağış ismi"
            fullWidth
            value={donationName}
            onChange={(e) => setDonationName(e.target.value)}
            error={donationName.trim().length > 0 && donationName.trim().length < 3}
            helperText={
              donationName.trim().length > 0 && donationName.trim().length < 3
                ? "En az 3 karakter olmalı"
                : ""
            }
          />
          <TextField
            label="Hedef miktar (₺)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ width: 180 }}
            inputProps={{ min: 1 }}
          />
        </Box>

        <TextField
          label="Bağış metni ekle…"
          multiline
          rows={3}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          disabled={saving || !isValid}
          sx={{
            backgroundColor: "#680C0C",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            py: 1,
            borderRadius: 8,
            width: "20%",
            mx: "auto",
            display: "block",
            "&:hover": { backgroundColor: "#930505" },
          }}
          onClick={handleAddDonation}
        >
          {saving ? "EKLENİYOR…" : "EKLE"}
        </Button>
      </CardContent>
    </Card>
  );
}
