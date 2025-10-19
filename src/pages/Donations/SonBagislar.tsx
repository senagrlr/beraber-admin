import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, Typography, Box, IconButton
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { listenRecentDonations } from "../../services/donationsService";

type Donation = {
  id: string;
  name?: string;
  createdAt?: { seconds: number };
};

export default function SonBagislar() {
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedOnce = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    const unsub = listenRecentDonations((donations) => {
      setRecentDonations(donations as any);
      setLoading(false);
    });

    return () => {
      unsub?.();
      mountedOnce.current = false;
    };
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
        Son eklenen bağışlar
      </Typography>

      {loading ? (
        <Typography color="gray">Yükleniyor...</Typography>
      ) : recentDonations.length === 0 ? (
        <Typography color="gray">Şimdilik bağış yok.</Typography>
      ) : (
        recentDonations.map((d) => (
          <Box
            key={d.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f0eaea",
              py: 1,
              cursor: "pointer",
              "&:hover": { backgroundColor: "#faf6f6" },
            }}
            onClick={() => goDetail(d.id)}
          >
            <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>
              {d.name}
            </Typography>
            <Box
              onClick={(e) => e.stopPropagation()} // satır klik’ini engelle
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <Typography color="gray">
                {d.createdAt
                  ? new Date(d.createdAt.seconds * 1000).toLocaleDateString("tr-TR")
                  : ""}
              </Typography>
              <IconButton
                size="small"
                onClick={() => goDetail(d.id)}
                title="Detaya git"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))
      )}
    </Card>
  );
}
