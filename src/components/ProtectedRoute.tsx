// src\components\ProtectedRoute.tsx
import { ReactNode, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/data/container";

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const mounted = useRef(true);

  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    mounted.current = true;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted.current) return;

      console.log("🧩 onAuthStateChanged fired → user:", u?.email ?? "none");
      setUser(u);

      // Giriş yapılmamışsa login ekranına yönlendir
      if (!u) {
        if (location.pathname !== ROUTES.login) {
          console.warn("⚠️ Kullanıcı yok, login sayfasına yönlendiriliyor...");
          navigate(ROUTES.login, { replace: true });
        }
        setAllowed(false);
        return;
      }

      try {
        let ok = false;
        for (let i = 0; i < 3; i++) {
          console.log(`🔄 Token denemesi #${i + 1}...`);
          await u.getIdToken(true);
          const tokenResult = await getIdTokenResult(u);
          const claims = tokenResult.claims as { admin?: boolean; wl?: boolean };
          console.log("🎟 Claims:", claims);

          ok = Boolean(claims.admin || claims.wl);
          if (ok) break;
          await wait(700);
        }

        if (!mounted.current) return;
        setAllowed(ok);

        if (!ok) {
          console.warn("🚫 Kullanıcının claims'i uygun değil, login'e yönlendiriliyor.");
          navigate(ROUTES.login, { replace: true });
        } else {
          console.log("✅ Kullanıcı yetkili, içeri giriyor.");
        }
      } catch (err) {
        console.error("❌ Claim kontrol hatası:", err);
        if (!mounted.current) return;
        setAllowed(false);
        navigate(ROUTES.login, { replace: true });
      }
    });

    return () => {
      mounted.current = false;
      unsub();
    };
  }, [navigate, location.pathname]);

  // Yükleme süreci
  if (allowed === null) {
    return (
      <Box minHeight="60vh" display="grid" sx={{ placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Kullanıcı yoksa ya da erişim izni yoksa login'e yönlendirilir
  if (!user || !allowed) {
    return (
      <Box minHeight="60vh" display="grid" sx={{ placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Yetkili kullanıcı
  return <>{children}</>;
}
