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
import { donationsService } from "@/data/container";
import { useNotifier } from "../../contexts/NotificationContext";
import {
  DONATION_CATEGORIES,
  type Donation,
} from "@/domain/donations/donation.schema";
import { useImageValidation } from "@/hooks/useImageValidation";
import { fmtMoney } from "@/utils/money";

/** UI için Donation görünümü (şimdilik direkt Donation) */
type DonationView = Donation;

/** Domain → View mapping (ileride genişleyebilir) */
function toView(d: Donation | null | undefined): DonationView | null {
  return d ?? null;
}

/** useEffect için minimal notifier tipi */
interface NotifierLike {
  showError: (msg: string) => void;
}

/** İlk detay fetch işini yapan helper (side-effect aynı, sadece ayrıştırıldı) */
async function fetchDonationOnce(
  id: string,
  setDoc: (doc: DonationView | null) => void,
  setLoading: (loading: boolean) => void,
  notifier: NotifierLike
) {
  setLoading(true);
  try {
    const first = await donationsService.getById(id);
    setDoc(toView(first));
  } catch (e) {
    console.error("Bağış detayı alınamadı:", e);
    notifier.showError("Bağış detayı yüklenirken bir hata oluştu.");
  } finally {
    setLoading(false);
  }
}

/** Realtime dinleyiciyi kuran helper */
function subscribeDonation(
  id: string,
  setDoc: (doc: DonationView | null) => void
): () => void {
  return donationsService.listenById(id, (d) => setDoc(toView(d)));
}

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const { validateImage } = useImageValidation();

  const [doc, setDoc] = useState<DonationView | null>(null);
  const [loading, setLoading] = useState(true);

  // edit modal state
  const [openEdit, setOpenEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // foto güncelleme sonrası cache kırmak için
  const [cacheBust, setCacheBust] = useState<number>(0);
  const [imgErr, setImgErr] = useState<string>("");

  useEffect(() => {
    if (!id) {
      notifier.showError("Geçersiz bağış kimliği.");
      navigate("/donations");
      return;
    }

    let unsub: (() => void) | undefined;

    const init = async () => {
      await fetchDonationOnce(id, setDoc, setLoading, notifier);
      unsub = subscribeDonation(id, setDoc);
    };

    void init();

    return () => {
      try {
        unsub?.();
      } catch {
        // subscriber cleanup sırasında hata yutulsun
      }
    };
  }, [id, navigate, notifier]);

  // photoUrl değiştiğinde cache-bust et
  useEffect(() => {
    if (doc?.photoUrl) setCacheBust(Date.now());
  }, [doc?.photoUrl]);

  const percent = useMemo(() => {
    const collected = Number(doc?.collected ?? 0);
    const amount = Number(doc?.amount ?? 0);
    if (!amount || amount <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((collected / amount) * 100))
    );
  }, [doc]);

  const statusChip = useMemo(() => {
    if (!doc) return null;
    const status = doc.status;
    if (status === "photo_pending") {
      return (
        <Chip
          size="small"
          label="Tamamlandı — foto bekliyor"
          color="warning"
          variant="outlined"
        />
      );
    }
    if (status === "active") {
      return (
        <Chip
          size="small"
          label="Devam ediyor"
          color="info"
          variant="outlined"
        />
      );
    }
    if (status === "completed") {
      return (
        <Chip
          size="small"
          label="Tamamlandı"
          color="success"
          variant="outlined"
        />
      );
    }
    if (status === "deleted") {
      return (
        <Chip
          size="small"
          label="Silindi"
          color="error"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        size="small"
        label={status || "Bilinmiyor"}
        variant="outlined"
      />
    );
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

    if (editName.trim().length < 3) {
      notifier.showWarning("Bağış adı en az 3 karakter olmalı.");
      return;
    }
    if (!editCategory) {
      notifier.showWarning("Bir kategori seçmelisin.");
      return;
    }
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      notifier.showWarning("Hedef miktar geçerli bir pozitif sayı olmalı.");
      return;
    }

    try {
      setSavingEdit(true);
      await donationsService.update(id, {
        name: editName.trim(),
        category: editCategory as (typeof DONATION_CATEGORIES)[number],
        amount: amt,
        description: editDescription.trim(),
      });
      setOpenEdit(false);
      notifier.showSuccess("Bağış bilgileri güncellendi.");
    } catch (err: any) {
      console.error("Bağış güncelleme hatası:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
      notifier.showError(`Güncelleme başarısız: ${errorMsg}`);
    } finally {
      setSavingEdit(false);
    }
  };

  /** Detay sayfasından foto yükleme / değiştirme */
  const handleUploadPhoto = async () => {
    if (!id) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file: File | null = e.target.files?.[0] ?? null;

      const errMsg = validateImage(file);
      if (errMsg) {
        setImgErr(errMsg);
        notifier.showWarning(errMsg);
        return;
      }

      try {
        notifier.showInfo?.("Fotoğraf yükleniyor…");
        const url = await donationsService.uploadPhoto(id, file as File);

        // Snapshot’ı beklemeden UI’ı güncelle (iyi UX)
        setDoc((prev) =>
          prev ? ({ ...prev, photoUrl: url } as DonationView) : prev
        );
        setImgErr("");
        setCacheBust(Date.now());
        notifier.showSuccess("Fotoğraf yüklendi.");
      } catch (err) {
        console.error("[handleUploadPhoto] upload error:", err);
        setImgErr(
          "Fotoğraf yüklenemedi. Storage kurallarını veya internet bağlantını kontrol et."
        );
        notifier.showError("Fotoğraf yüklenemedi.");
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
        <Alert severity="warning">
          Bağış bulunamadı veya silinmiş.
        </Alert>
      </Box>
    );
  }

  const rawPhotoUrl =
    typeof doc.photoUrl === "string" && doc.photoUrl.trim()
      ? doc.photoUrl.trim()
      : "";
  const photoUrl = rawPhotoUrl
    ? `${rawPhotoUrl}${
        rawPhotoUrl.includes("?") ? "&" : "?"
      }cb=${cacheBust || 0}`
    : "";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Bağış Detay
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <CardContent>
          {/* Üst başlık + aksiyonlar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h6" fontWeight={700} color="#5B3B3B">
                {doc.name}
              </Typography>
              {statusChip}
              {doc.status !== "active" && !rawPhotoUrl && (
                <Chip
                  size="small"
                  label="Foto eklenmemiş"
                  variant="outlined"
                />
              )}
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={handleOpenEdit}
                title="Düzenle"
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={async () => {
                  if (!id) return;
                  const ok = await notifier.showConfirm(
                    "Bağışı Sil",
                    "Bu bağışı silmek istediğine emin misin? Bu işlem geri alınamaz (ancak veritabanında 'deleted' olarak işaretlenir)."
                  );
                  if (!ok) return;
                  try {
                    await donationsService.deleteById(id);
                    notifier.showSuccess("Bağış silindi.");
                    navigate("/donations");
                  } catch {
                    notifier.showError("Silme işlemi başarısız.");
                  }
                }}
                title="Sil"
              >
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
                {fmtMoney(doc.collected ?? 0)}/{fmtMoney(doc.amount)} ₺
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                height: 8,
                borderRadius: 999,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#6A2A2B",
                },
                backgroundColor: "#eee",
              }}
            />
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "220px 1fr" }}
            gap={3}
          >
            {/* Sol blok: foto + alanlar */}
            <Box>
              <Box
                sx={{
                  width: { xs: "100%", sm: 180 },
                  height: 180,
                  borderRadius: 4,
                  border: rawPhotoUrl ? "none" : "3px dashed #E3D8D8",
                  backgroundColor: "#FBF8F8",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  mb: 2,
                  position: "relative",
                }}
              >
                {rawPhotoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt={doc.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        console.error(
                          "[DonationDetail] IMG LOAD ERROR:",
                          {
                            src: (e.currentTarget as HTMLImageElement).src,
                          }
                        );
                        setImgErr(
                          "Görsel yüklenemedi. (URL token’ı, Storage kuralları veya CORS’u kontrol edin.)"
                        );
                      }}
                    />
                    <Button
                      size="small"
                      onClick={handleUploadPhoto}
                      startIcon={<AddPhotoAlternate />}
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        borderRadius: 6,
                        textTransform: "none",
                        backgroundColor: "rgba(255,255,255,.9)",
                        ":hover": {
                          backgroundColor: "rgba(255,255,255,1)",
                        },
                      }}
                    >
                      Değiştir
                    </Button>
                  </>
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
                <Typography
                  sx={{ color: "#a33", fontSize: 12, mt: -1, mb: 1 }}
                >
                  {imgErr}
                </Typography>
              )}

              <Box mb={1}>
                <Typography sx={{ fontSize: 12, color: "#987" }}>
                  Kategori
                </Typography>
                <Typography
                  sx={{ fontWeight: 600, color: "#5B3B3B" }}
                >
                  {doc.category || "—"}
                </Typography>
              </Box>
            </Box>

            {/* Sağ blok: bağış metni */}
            <Box>
              <Typography
                sx={{ fontSize: 12, color: "#987", mb: 0.5 }}
              >
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
                  wordBreak: "break-word",
                }}
              >
                {doc.description || "—"}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Düzenleme Dialogu */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Bağışı Düzenle</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="Bağış adı"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            error={
              editName.trim().length > 0 &&
              editName.trim().length < 3
            }
            helperText={
              editName.trim().length > 0 &&
              editName.trim().length < 3
                ? "En az 3 karakter olmalı"
                : ""
            }
          />
          <TextField
            select
            label="Kategori"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            fullWidth
          >
            {DONATION_CATEGORIES.map((c) => (
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
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Bağış metni"
            multiline
            minRows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
          />

          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternate />}
            onClick={handleUploadPhoto}
            sx={{ justifySelf: "start" }}
          >
            {rawPhotoUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenEdit(false)}
            disabled={savingEdit}
          >
            Vazgeç
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={savingEdit}
          >
            {savingEdit ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
