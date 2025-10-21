// src\pages\Donations\BagisEkle.tsx
import { useState } from "react";
import {
  Card, CardContent, Typography, Box,
  TextField, Button, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
import { addDonation, updateDonation } from "../../services/donationsService";
import { useNotifier } from "../../contexts/NotificationContext";

const CATEGORIES = [
  "Eğitim Yardımı",
  "Beslenme Yardımı",
  "Sağlık Yardımı",
  "Giyecek Yardımı",
  "Afet Yardımı",
  "Temel İhtiyaç Yardımı",
  "Hayvanlara Destek Yardımı",
  "Çevresel Yardım",
];

export default function BagisEkle() {
  const [donationName, setDonationName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const notifier = useNotifier();

  const handleAddDonation = async () => {
    if (!donationName || !category || !amount) {
      notifier.showWarning("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      notifier.showWarning("Miktar geçerli bir sayı olmalıdır.");
      return;
    }

    try {
      setSaving(true);
      const { id } = await addDonation({
        name: donationName.trim(),
        category,
        amount: numericAmount,
        description: text.trim(),
      });

      const cleanUrl = photoUrl.trim();
      if (cleanUrl) {
        await updateDonation(id, { photoUrl: cleanUrl });
      }

      setDonationName("");
      setCategory("");
      setAmount("");
      setText("");
      setPhotoUrl("");

      notifier.showSuccess("Bağış başarıyla eklendi!");
    } catch (err) {
      console.error("Bağış ekleme hatası:", err);
      notifier.showError("Bağış eklenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const previewOk = /^https?:\/\//i.test(photoUrl.trim());

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
          label="Fotoğraf URL'si"
          placeholder="https://…"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
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
            mb: 3,
            color: "#680C0C",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {previewOk ? (
            <img
              src={photoUrl.trim()}
              alt="Bağış görseli"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
              onError={() => {}}
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="kategori-label">Kategori seç</InputLabel>
          <Select
            labelId="kategori-label"
            value={category}
            label="Kategori seç"
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
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
          />
          <TextField
            label="Miktar"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ width: 150 }}
          />
        </Box>

        <TextField
          label="Bağış metni ekle..."
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
          disabled={saving}
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

