import { useState } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import { db } from "../../services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Topluluk() {
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!photoUrl.trim()) {
      alert("Fotoğraf URL'si gerekli.");
      return;
    }
    try {
      setSaving(true);
      await addDoc(collection(db, "topluluk_gonderileri"), {
        text: text.trim(),
        photoUrl: photoUrl.trim(),     // doğrudan URL’yi yazıyoruz
        status: "active",
        createdAt: serverTimestamp(),
      });
      setText("");
      setPhotoUrl("");
    } catch (e) {
      console.error(e);
      alert("Gönderi eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const previewOk = /^https?:\/\//i.test(photoUrl.trim());

  return (
    <Box sx={{ backgroundColor: "#E8E4E4", borderRadius: 3, p: 6 }}>
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B" sx={{ textAlign: "center" }}>
        Topluluk
      </Typography>

      {/* Foto URL */}
      <TextField
        label="Fotoğraf URL'si"
        placeholder="https://…"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      {/* Önizleme */}
      <Box
        sx={{
          borderRadius: 4,
          border: "2px dashed #D1BDB7",
          backgroundColor: "#F3ECEA",
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {previewOk ? (
          <img
            src={photoUrl.trim()}
            alt="Topluluk"
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
          />
        ) : (
          <Typography color="#6A2A2B" fontWeight={700} textAlign="center">
            Fotoğraf URL’si gir
            <br />
            <Typography component="span" color="#9f8e8a" fontSize={12}>
              Öneri: 500 × 500
            </Typography>
          </Typography>
        )}
      </Box>

      {/* Metin alanı */}
      <TextField
        multiline
        minRows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Metin ekle…"
        sx={{
          mt: 2,
          width: "100%",
          "& .MuiOutlinedInput-root": { borderRadius: 3, backgroundColor: "#fff" },
        }}
      />

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
        {saving ? "Yükleniyor…" : "YAYINLA"}
      </Button>
    </Box>
  );
}
