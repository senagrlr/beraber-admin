// src/pages/Donations/FotoEklenmesiGereken.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Box, IconButton, Tooltip } from "@mui/material";
import { Edit, AddPhotoAlternate } from "@mui/icons-material";
import { donationsService } from "@/data/container";
import { formatFirestoreDate } from "@/utils/dateFormatters";

type Row = {
  id: string;
  name?: string;
  createdAt?: { toDate?: () => Date } | { seconds: number } | Date | null;
};

export default function FotoEklenmesiGereken() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const reload = async () => {
    try {
      setLoading(true);
      const r = await donationsService.fetchPhotoPending();
      setRows(r as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const goDetail = (id: string) => navigate(`/donations/${id}`);

  const handleUploadPhotos = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (e: any) => {
      const files: FileList | undefined = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        try {
          await donationsService.uploadPhoto(id, file);
        } catch (err) {
          console.error("[FotoEklenmesiGereken] upload error:", err);
          // burada istersen toast / snackbar da kullanabilirsin
        }
      }

      // Foto yüklendikten sonra listeyi tazele
      await reload();
    };

    input.click();
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        backgroundColor: "#FFFFFF",
        p: 2,
        maxHeight: 250,
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
        Fotoğraf eklenmesi gereken bitmiş bağışlar
      </Typography>

      {loading ? (
        <Typography color="gray">Yükleniyor...</Typography>
      ) : rows.length === 0 ? (
        <Typography color="gray">Şimdilik bağış yok.</Typography>
      ) : (
        rows.map((d) => (
          <Box
            key={d.id}
            onClick={() => goDetail(d.id)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f0eaea",
              py: 1,
              cursor: "pointer",
              "&:hover": { backgroundColor: "#faf6f6" },
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>
              {d.name || "—"}
            </Typography>

            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Typography color="gray">
                {formatFirestoreDate(d.createdAt)}
              </Typography>

              <Tooltip title="Fotoğraf ekle (birden fazla)">
                <IconButton
                  size="small"
                  onClick={() => handleUploadPhotos(d.id)}
                >
                  <AddPhotoAlternate fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Detaya git">
                <IconButton
                  size="small"
                  onClick={() => goDetail(d.id)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))
      )}
    </Card>
  );
}
