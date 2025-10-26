// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut, getIdTokenResult } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

// 🔁 usersService yerine teamService kullan
import { auth, teamService } from "@/data/container";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const mounted = useRef(true);

  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    mounted.current = true;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted.current) return;

      setUser(u);
      if (!u) {
        setAllowed(false);
        return;
      }

      try {
        // (Opsiyonel) Admin claim’i varsa direkt geçir
        const token = await getIdTokenResult(u).catch(() => null);
        const isAdmin = token?.claims?.admin === true;

        let ok = false;
        if (isAdmin) {
          ok = true;
        } else {
          // team_members'ta e-posta whitelist kontrolü
          const normalized = (u.email || "").trim().toLowerCase();
          ok = normalized ? await teamService.isEmailAllowed(normalized) : false;
        }

        if (!mounted.current) return;
        setAllowed(ok);
        if (!ok) {
          await signOut(auth).catch(() => {});
        }
      } catch (e) {
        if (!mounted.current) return;
        setAllowed(false);
        await signOut(auth).catch(() => {});
      }
    });

    return () => {
      mounted.current = false;
      unsub();
    };
  }, []);

  // allowed === false olduğunda login'e gönder
  useEffect(() => {
    if (allowed === false) {
      navigate("/login", { replace: true });
    }
  }, [allowed, navigate]);

  if (allowed === null) {
    return (
      <Box minHeight="60vh" display="grid" sx={{ placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !allowed) return null;

  return <>{children}</>;
}
