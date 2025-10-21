import { useState } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import { db } from "../../services/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "../../constants/firestore";

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
};

export default function BeraberdeBuAy() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const trimmed = photoUrl.trim();
    if (!trimmed) {
      alert("Fotoğraf URL'si gerekli.");
      return;
    }
    try {
      setSaving(true);
      const key = monthKey();
      await setDoc(
        doc(db, COLLECTIONS.HIGHLIGHTS, key),
        {
          monthKey: key,
          photoUrl: trimmed,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Topluluk’ta olduğu gibi: input’u ve preview’u sıfırla
      setPhotoUrl("");
      alert("Kaydedildi.");
    } catch (e) {
      console.error(e);
      alert("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const previewOk = /^https?:\/\//i.test(photoUrl.trim());

  return (
    <Box sx={{ backgroundColor: "#E8E4E4", borderRadius: 3, p: 6 }}>
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
        Beraber’de Bu Ay
      </Typography>

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
          border: "2px dashed #D1BDB7",
          backgroundColor: "#F3ECEA",
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {previewOk ? (
          <img
            src={photoUrl.trim()}
            alt="Bu Ay"
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
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

      <Button
        variant="contained"
        size="large"
        onClick={onSave}
        disabled={saving || !photoUrl.trim()}
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
