// src\pages\Donations\SonBagislar.tsx
import { useEffect, useState } from "react"; // useRef kaldırıldı
import { useNavigate } from "react-router-dom";
import { Card, Typography, Box, IconButton, CircularProgress } from "@mui/material"; // CircularProgress eklendi (opsiyonel)
import { Edit } from "@mui/icons-material";
import { donationsService } from "@/data/container";
// ⬇️ GÜNCELLEME: Domain'den doğru Donation tipini import et
import type { Donation } from "@/domain/donations/donation.schema";

// ⬇️ SİLİNDİ: Yerel 'type Donation' tanımına gerek kalmadı
// type Donation = {
//  id: string;
//  name?: string;
//  createdAt?: { toDate?: () => Date } | { seconds: number } | Date | null;
// };

export default function SonBagislar() {
  // ⬇️ GÜNCELLEME: State tipi artık import edilen Donation
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  // ⬇️ SİLİNDİ: mountedOnce ref'i kaldırıldı
  // const mountedOnce = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ⬇️ SİLİNDİ: mountedOnce kontrolü kaldırıldı
    // if (mountedOnce.current) return;
    // mountedOnce.current = true;

    console.log("[SonBagislar] Listener kuruluyor..."); // Bilgi logu
    setLoading(true); // Listener başlarken loading'i true yapalım

    // donationsService.listenRecent artık doğrudan Donation[] döndürmeli
    const off = donationsService.listenRecent(10, (donations) => {
      // ⬇️ YENİ LOG: Listener'dan veri geldiğinde konsola yazdır
      console.log("[SonBagislar] Listener'dan yeni veri geldi:", donations);
      // ⬇️ GÜNCELLEME: 'as any' kaldırıldı
      setRecentDonations(donations);
      setLoading(false);
    });

    // useEffect'in temizleme fonksiyonu listener'ı kapatır
    return () => {
      console.log("[SonBagislar] Listener temizleniyor..."); // Bilgi logu
      off?.(); // Listener'ı kapat
      // ⬇️ SİLİNDİ: mountedOnce resetlemeye gerek yok
      // mountedOnce.current = false;
    };
    // ⬇️ GÜNCELLEME: Bağımlılık dizisi boş kalmalı, listener sadece mount/unmount'ta çalışır
  }, []);

  const goDetail = (id: string) => navigate(`/donations/${id}`);

  // formatDate fonksiyonu domain tipindeki Date objesiyle çalışacak
  const formatDate = (val: Donation["createdAt"]) => {
    if (!val) return "";
    // Domain mapper Date objesi döndürdüğü için sadece instanceof Date kontrolü yeterli
    if (val instanceof Date) {
        try {
            return val.toLocaleDateString("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
             return "-"; // Geçersiz tarih durumu
        }
    }
    return "-"; // Beklenmeyen tip
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        backgroundColor: "#FFFFFF",
        p: 2,
        // Yüksekliği biraz artıralım veya duruma göre ayarlayalım
        minHeight: 250, // Sabit maxHeight yerine minHeight kullanmak daha esnek olabilir
        display: 'flex', // Dikeyde hizalama için
        flexDirection: 'column', // Dikeyde hizalama için
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={2} color="#5B3B3B">
        Son eklenen bağışlar
      </Typography>

      {/* İçeriği dikeyde ortalamak için Box */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
               <CircularProgress size={24} />
           </Box>
        ) : recentDonations.length === 0 ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Typography color="gray">Şimdilik bağış yok.</Typography>
           </Box>
        ) : (
          // Scrollable içerik için ayrı bir Box (gerekirse)
          <Box sx={{ overflowY: 'auto', flexShrink: 1 }}>
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
                  // Son elemanın alt çizgisini kaldır (opsiyonel)
                  '&:last-child': { borderBottom: 'none' }
                }}
                onClick={() => goDetail(d.id)}
              >
                <Typography sx={{ fontWeight: 600, color: "#5B3B3B" }}>
                  {/* Repo düzeltildiği için d.name artık doğru gelmeli */}
                  {d.name || "—"}
                </Typography>
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  {/* Tarih formatlama domain tipiyle çalışır */}
                  <Typography color="gray" variant="caption">{formatDate(d.createdAt)}</Typography>
                  <IconButton size="small" onClick={() => goDetail(d.id)} title="Detaya git">
                    <Edit fontSize="inherit" /> {/* Boyutu inherit yapalım */}
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