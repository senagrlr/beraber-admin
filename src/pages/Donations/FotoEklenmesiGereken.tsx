// src/pages/Donations/FotoEklenmesiGereken.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Box, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { donationsService } from "@/data/container";

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
      const r = await donationsService.fetchPhotoPending(); // ⬅️ container servisi
      setRows(r as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const goDetail = (id: string) => navigate(`/donations/${id}`);

  const formatDate = (val: Row["createdAt"]) => {
    if (!val) return "";
    // Firestore Timestamp, Date veya {seconds} için korumalı okuma
    if (val instanceof Date) return val.toLocaleDateString("tr-TR");
    // @ts-ignore
    if (typeof val?.toDate === "function") return val.toDate().toLocaleDateString("tr-TR");
    // @ts-ignore
    if (typeof val?.seconds === "number") return new Date(val.seconds * 1000).toLocaleDateString("tr-TR");
    return "";
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
            <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>{d.name || "—"}</Typography>

            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <Typography color="gray">{formatDate(d.createdAt)}</Typography>
              <IconButton size="small" onClick={() => goDetail(d.id)} title="Detaya git">
                <Edit fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))
      )}
    </Card>
  );
}
