// src/pages/Donations/DonationDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Edit, Delete, AddPhotoAlternate } from "@mui/icons-material";
import {
  getDonationById,
  listenDonationById,
  updateDonation,
  uploadDonationPhoto,
  deleteDonationById,
  type DonationDoc,
} from "../../services/donationsService";

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

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Number(n || 0));

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<DonationDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // edit modal state
  const [openEdit, setOpenEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // foto güncelleme sonrası cache kırmak için
  const [cacheBust, setCacheBust] = useState<number>(0);
  const [imgErr, setImgErr] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    let unsub: (() => void) | null = null;

    (async () => {
      setLoading(true);
      const first = await getDonationById(id);
      setDoc(first);
      setLoading(false);
      unsub = listenDonationById(id, (d) => setDoc(d));
    })();

    return () => {
      try { unsub?.(); } catch {}
    };
  }, [id]);

  // photoUrl değiştiğinde cache-bust et
  useEffect(() => {
    if (doc?.photoUrl) setCacheBust(Date.now());
  }, [doc?.photoUrl]);

  const percent = useMemo(() => {
    const collected = Number(doc?.collected ?? 0);
    const amount = Number(doc?.amount ?? 0);
    if (!amount || amount <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((collected / amount) * 100)));
  }, [doc]);

  const statusChip = useMemo(() => {
    if (!doc) return null;
    if (doc.status === "photo_pending") {
      return <Chip size="small" label="Tamamlandı — foto bekliyor" color="warning" variant="outlined" />;
    }
    if (doc.status === "active") {
      return <Chip size="small" label="Devam ediyor" color="info" variant="outlined" />;
    }
    return <Chip size="small" label="Tamamlandı" color="success" variant="outlined" />;
  }, [doc]);

  const handleOpenEdit = () => {
    if (!doc) return;
    setEditName(doc.name || "");
    setEditCategory(doc.category || "");
    setEditAmount(String(doc.amount ?? ""));
    setEditDescription(doc.description || "");
    setOpenEdit(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateDonation(id, {
        name: editName.trim(),
        category: editCategory,
        amount: Number(editAmount),
        description: editDescription.trim(),
      });
      setOpenEdit(false);
    } catch {
      alert("Güncelleme başarısız.");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const ok = confirm("Bu bağışı silmek istediğine emin misin? Bu işlem geri alınamaz.");
    if (!ok) return;
    try {
      await deleteDonationById(id);
      navigate("/donations");
    } catch {
      alert("Silme işlemi başarısız.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!id) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        // 1) Storage’a yükle + indirme URL’i al
        const url = await uploadDonationPhoto(id, file);

        // 2) Snapshot gelmesini beklemeden hemen UI’da göster
        setDoc((prev) => (prev ? { ...prev, photoUrl: url } as DonationDoc : prev));
        setImgErr("");
        setCacheBust(Date.now());
      } catch (err) {
        console.error("[handleUploadPhoto] upload error:", err);
        alert("Fotoğraf yüklenemedi.");
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Bağış bulunamadı.</Alert>
      </Box>
    );
  }

  const rawPhotoUrl = typeof doc.photoUrl === "string" && doc.photoUrl.trim() ? doc.photoUrl.trim() : "";
  const photoUrl = rawPhotoUrl
    ? `${rawPhotoUrl}${rawPhotoUrl.includes("?") ? "&" : "?"}cb=${cacheBust || 0}`
    : "";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Bağış Detay
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <CardContent>
          {/* Üst başlık + aksiyonlar */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h6" fontWeight={700} color="#5B3B3B">
                {doc.name}
              </Typography>
              {statusChip}
              {doc.status !== "active" && !rawPhotoUrl && (
                <Chip size="small" label="Foto eklenmemiş" variant="outlined" />
              )}
            </Box>
            <Box>
              <IconButton size="small" onClick={handleOpenEdit} title="Düzenle">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleDelete} title="Sil">
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Progress */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography sx={{ fontSize: 12, color: "#6b4a4a" }}>
                %{percent} tamamlandı
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6b4a4a" }}>
                {fmtMoney(doc.collected)}/{fmtMoney(doc.amount)} ₺
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                height: 8,
                borderRadius: 999,
                "& .MuiLinearProgress-bar": { backgroundColor: "#6A2A2B" },
                backgroundColor: "#eee",
              }}
            />
          </Box>

          <Box display="grid" gridTemplateColumns="220px 1fr" gap={3}>
            {/* Sol blok: foto + alanlar */}
            <Box>
              {/* Fotoğraf */}
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  borderRadius: 4,
                  border: rawPhotoUrl ? "none" : "3px dashed #E3D8D8",
                  backgroundColor: "#FBF8F8",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  mb: 2,
                }}
              >
                {rawPhotoUrl ? (
                  <img
                    src={photoUrl}
                    alt={doc.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      console.error("[DonationDetail] IMG LOAD ERROR:", {
                        src: (e.currentTarget as HTMLImageElement).src,
                      });
                      setImgErr("Görsel yüklenemedi. Storage kuralları veya URL token’ı kontrol edin.");
                    }}
                  />
                ) : (
                  <Button
                    startIcon={<AddPhotoAlternate />}
                    onClick={handleUploadPhoto}
                    sx={{ textTransform: "none", color: "#6A2A2B" }}
                  >
                    Fotoğraf ekle
                  </Button>
                )}
              </Box>

              {imgErr && (
                <Typography sx={{ color: "#a33", fontSize: 12, mt: -1, mb: 1 }}>
                  {imgErr}
                </Typography>
              )}

              {/* Kategori */}
              <Box mb={1}>
                <Typography sx={{ fontSize: 12, color: "#987" }}>Kategori</Typography>
                <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>
                  {doc.category || "—"}
                </Typography>
              </Box>
            </Box>

            {/* Sağ blok: bağış metni */}
            <Box>
              <Typography sx={{ fontSize: 12, color: "#987", mb: 0.5 }}>
                Bağış metni
              </Typography>
              <Box
                sx={{
                  backgroundColor: "#FBF8F8",
                  borderRadius: 2,
                  minHeight: 160,
                  p: 2,
                  color: "#5B3B3B",
                  whiteSpace: "pre-wrap",
                }}
              >
                {doc.description || "—"}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Düzenleme Dialogu */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Bağışı Düzenle</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="Bağış adı"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Kategori"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            fullWidth
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Hedef miktar (₺)"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            helperText="Toplanan miktar otomatik hesaplanır, düzenlenemez."
            fullWidth
          />
          <TextField
            label="Bağış metni"
            multiline
            minRows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
          />

          {/* Fotoğrafı buradan da yükleyebilirsin */}
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternate />}
            onClick={handleUploadPhoto}
            sx={{ justifySelf: "start" }}
          >
            Fotoğraf Yükle
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Vazgeç</Button>
          <Button variant="contained" onClick={handleSave}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
