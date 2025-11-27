// src/pages/Donations/SonBagislar.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Box, IconButton, CircularProgress } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { donationsService } from "@/data/container";
import type { Donation } from "@/domain/donations/donation.schema";
import { formatFirestoreDate } from "@/utils/dateFormatters";
import { RECENT_DONATIONS_LIMIT } from "@/constants/limits";

export default function SonBagislar() {
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[SonBagislar] Listener kuruluyor...");
    setLoading(true);

    const off = donationsService.listenRecent(
      RECENT_DONATIONS_LIMIT,
      (donations) => {
        console.log("[SonBagislar] Listener'dan yeni veri geldi:", donations);
        setRecentDonations(donations);
        setLoading(false);
      }
    );

    return () => {
      console.log("[SonBagislar] Listener temizleniyor...");
      off?.();
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
        minHeight: 250,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
        Son eklenen bağışlar
      </Typography>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : recentDonations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Typography color="gray">Şimdilik bağış yok.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: "auto", flexShrink: 1 }}>
            {recentDonations.map((d) => (
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
                  "&:last-child": { borderBottom: "none" },
                }}
                onClick={() => goDetail(d.id)}
              >
                <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>
                  {d.name || "—"}
                </Typography>
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Typography color="gray" variant="caption">
                    {formatFirestoreDate(d.createdAt)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => goDetail(d.id)}
                    title="Detaya git"
                  >
                    <Edit fontSize="inherit" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}
