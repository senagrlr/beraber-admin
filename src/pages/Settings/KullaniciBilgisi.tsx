// src/pages/Settings/KullaniciBilgisi.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { onAuthStateChanged, getIdTokenResult, sendPasswordResetEmail } from "firebase/auth";
import { useNotifier } from "../../contexts/NotificationContext";
import { auth, usersService } from "@/data/container"; // Firestore yok, service kullan

type TeamMember = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

export default function KullaniciBilgisi() {
  const [userState, setUserState] = useState(auth.currentUser);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [roleText, setRoleText] = useState<string>("—");
  const [loading, setLoading] = useState<boolean>(true);
  const notifier = useNotifier();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserState(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const u = userState;
        if (!u?.email) {
          if (alive) {
            setMember(null);
            setRoleText("—");
          }
          return;
        }

        // 1) team_members → servis
        const m = await usersService.getMemberByEmail(u.email);

        // 2) admin claim (istersen usersService.isAdmin(u) olarak soyutlayabilirsin)
        const token = await getIdTokenResult(u, true);
        const isAdmin = token.claims?.admin === true;

        // 3) rol metni
        const role =
          (m?.role && String(m.role).trim()) ||
          (isAdmin ? "Yönetici" : "Kullanıcı");

        if (alive) {
          setMember(m ?? null);
          setRoleText(role);
        }
      } catch (e) {
        if (alive) {
          setMember(null);
          setRoleText("—");
        }
        console.warn("[KullaniciBilgisi] fetch error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userState]);

  const onSendReset = async () => {
    if (!userState?.email) return;
    try {
      await sendPasswordResetEmail(auth, userState.email);
      notifier.showSuccess("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    } catch {
      notifier.showError("Şifre sıfırlama bağlantısı gönderilemedi.");
    }
  };

  const displayName =
    member?.name?.trim() ||
    userState?.displayName?.trim() ||
    (userState?.email ? userState.email.split("@")[0] : "—");

  const email = member?.email || userState?.email || "—";
  const phone = member?.phone || "—";

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Kullanıcı Bilgisi
        </Typography>

        {loading ? (
          <Typography color="text.secondary">Yükleniyor…</Typography>
        ) : (
          <>
            <Box mb={3}>
              <Typography fontWeight={700}>Kullanıcı İsmi</Typography>
              <Typography color="text.secondary">{displayName}</Typography>
            </Box>

            <Box mb={3}>
              <Typography fontWeight={700}>İletişim Bilgisi</Typography>
              <Typography color="text.secondary">Mail: {email}</Typography>
              <Typography color="text.secondary">Telefon: {phone}</Typography>
            </Box>

            <Box mb={3}>
              <Typography fontWeight={700}>Rol</Typography>
              <Typography color="text.secondary">{roleText}</Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: "#E8E4E4",
                p: 2.5,
                borderRadius: 3,
                display: "inline-block",
              }}
            >
              <Typography fontWeight={700} mb={1.5}>
                Şifre Değiştir
              </Typography>
              <Button
                variant="contained"
                onClick={onSendReset}
                sx={{
                  textTransform: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  backgroundColor: "#6A2A2B",
                  ":hover": { backgroundColor: "#5B3B3B" },
                }}
              >
                Sıfırlama Bağlantısı Gönder
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
