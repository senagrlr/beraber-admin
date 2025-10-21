// src\pages\Dashboard\BitenBagisKampanyalari.tsx
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchCompletedCampaigns } from "../../services/donationsService";

type CompletedDonation = {
  id: string;
  name: string;
  createdAt?: any; // Firestore Timestamp
};

export default function BitenBagisKampanyalari() {
  const [items, setItems] = useState<CompletedDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCompletedCampaigns(10);
        if (mounted) setItems(data);
      } catch (e) {
        console.error("Biten bağışlar alınamadı:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (ts?: any) => {
    if (!ts) return "-";
    // Firestore Timestamp ise:
    const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("tr-TR"); // Örn: 13.10.2025
  };

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 3,
        p: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        height: "100%",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2} color="#5B3B3B">
        Biten Bağış Kampanyaları
      </Typography>

      {loading ? (
        <Typography color="gray">Yükleniyor…</Typography>
      ) : items.length === 0 ? (
        <Typography color="gray">Henüz biten bağış bulunmuyor.</Typography>
      ) : (
        items.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #eee",
              py: 1,
            }}
          >
            <Typography>{item.name}</Typography>
            <Typography color="gray">{formatDate(item.createdAt)}</Typography>
          </Box>
        ))
      )}
    </Box>
  );
}
