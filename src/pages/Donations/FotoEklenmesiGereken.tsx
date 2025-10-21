// src\pages\Donations\FotoEklenmesiGereken.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Box, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { fetchPhotoPendingDonations } from "../../services/donationsService";

type Donation = {
  id: string;
  name?: string;
  createdAt?: { seconds: number };
};

export default function FotoEklenmesiGereken() {
  const [rows, setRows] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const reload = async () => {
    setLoading(true);
    const r = await fetchPhotoPendingDonations();
    setRows(r as any);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const goDetail = (id: string) => navigate(`/donations/${id}`);

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
            <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>{d.name}</Typography>

            <Box
              onClick={(e) => e.stopPropagation()} // satıra tıklamayı engelle
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <Typography color="gray">
                {d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : ""}
              </Typography>
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
