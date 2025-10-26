// src\pages\Donations\BagisEkle.tsx
import { useMemo, useState } from "react";
import {
  Card, CardContent, Typography, Box,
  TextField, Button, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
// ⬇️ 'auth' import'u eklendi
import { donationsService, auth } from "@/data/container";
import { useNotifier } from "../../contexts/NotificationContext";
// ⬇️ YENİ IMPORT: Merkezi kategori listesini domain'den al
import { DONATION_CATEGORIES } from "@/domain/donations/donation.schema";

// ⬇️ SİLİNDİ: Bu eski, tekrar eden listeye artık gerek yok.
// const CATEGORIES = [ ... ];

export default function BagisEkle() {
  const [donationName, setDonationName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [imgError, setImgError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const notifier = useNotifier();

  const trimmedUrl = photoUrl.trim();
  const previewOk = /^https?:\/\//i.test(trimmedUrl) && !imgError;

  const isValid = useMemo(() => {
    const nm = donationName.trim();
    const amt = Number(amount);
    // ⬇️ Schema ile uyumlu hale getirildi (min 3 karakter)
    return nm.length >= 3 && !!category && Number.isFinite(amt) && amt > 0;
  }, [donationName, category, amount]);

  const resetForm = () => {
    setDonationName("");
    setCategory("");
    setAmount("");
    setText("");
    setPhotoUrl("");
    setImgError("");
  };

  const handleAddDonation = async () => {
    if (!isValid) {
      notifier.showWarning("Lütfen tüm zorunlu alanları (İsim en az 3 karakter) geçerli şekilde doldurun.");
      return;
    }

    // 1. Kullanıcıyı al
    const user = auth.currentUser;
    if (!user) {
      notifier.showError("Oturumunuzun süresi dolmuş. Lütfen yeniden giriş yapın.");
      return;
    }

    try {
      setSaving(true);

      // 2. 'uid' parametresini gönder
      const { id } = await donationsService.create({
        name: donationName.trim(),
        category,
        amount: Number(amount),
        description: text.trim(),
      }, user.uid);

      if (trimmedUrl) {
        // 3. Fotoğrafı 'setPhotoUrl' ile ekle
        await donationsService.setPhotoUrl(id, trimmedUrl);
      }

      resetForm();
      notifier.showSuccess("Bağış başarıyla eklendi!");
    } catch (err: any) {
      console.error("Bağış ekleme hatası:", err);
      const errorMsg = (err instanceof Error) ? err.message : "Bilinmeyen bir hata oluştu.";
      // Zod hatası veya 'indexOf' hatası burada gösterilecek
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

        {/* Fotoğraf URL alanı + önizleme */}
        <TextField
          label="Fotoğraf URL'si (opsiyonel)"
          placeholder="https://…/gorsel.jpg"
          value={photoUrl}
          onChange={(e) => {
            setImgError("");
            setPhotoUrl(e.target.value);
          }}
          fullWidth
          sx={{ mb: 1.5 }}
        />

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
          {previewOk ? (
            <img
              src={trimmedUrl}
              alt="Bağış görseli"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
              onError={() => setImgError("Görsel yüklenemedi. URL’yi kontrol et.")}
            />
          ) : (
            <Typography color="#6A2A2B" fontWeight={700} textAlign="center">
              Fotoğraf URL'si gir (opsiyonel)
              <br />
              <Typography component="span" variant="body2" color="gray">
                Örn: https://…/gorsel.jpg
              </Typography>
            </Typography>
          )}
        </Box>

        {!!imgError && (
          <Typography sx={{ color: "#a33", fontSize: 12, mt: -1, mb: 1.5 }}>
            {imgError}
          </Typography>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="kategori-label">Kategori seç</InputLabel>
          <Select
            labelId="kategori-label"
            value={category}
            label="Kategori seç"
            onChange={(e) => setCategory(e.target.value)}
          >
            {/* ⬇️ DÜZELTME: İmport edilen 'DONATION_CATEGORIES' listesini kullan */}
            {DONATION_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Bağış ismi"
            fullWidth
            value={donationName}
            onChange={(e) => setDonationName(e.target.value)}
            // ⬇️ Hata mesajını doğrudan UI'da göstermek için eklendi
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