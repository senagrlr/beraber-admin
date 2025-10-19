// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

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
        const ok = await checkAuthorization(u);
        if (!mounted.current) return;
        setAllowed(ok);
        if (!ok) {
          await signOut(auth).catch(() => {});
        }
      } catch {
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

  // Yetkilendirme: 1) team_members (emailLower + active) 2) users/{uid}.role === 'admin' 3) custom claims admin:true
  async function checkAuthorization(u: User): Promise<boolean> {
    // 1) team_members whitelist (emailLower == user.email && active == true)
    const email = (u.email || "").trim().toLowerCase();
    if (email) {
      try {
        const qy = query(
          collection(db, "team_members"),
          where("emailLower", "==", email),
          where("active", "==", true),
          limit(1)
        );
        const snap = await getDocs(qy);
        if (snap.size > 0) return true;
      } catch {
        // index yoksa “where emailLower + active” atlamış oluruz; aşağıdaki alternatiflere düşer
      }
    }

    // 2) users/{uid}.role === 'admin'
    try {
      const us = await getDoc(doc(db, "users", u.uid));
      const role = us.exists() ? (us.data() as any)?.role : null;
      if (role === "admin") return true;
    } catch {
      // geç
    }

    // 3) Custom claims
    try {
      const token = await u.getIdTokenResult(true);
      if (token.claims && (token.claims as any).admin === true) {
        return true;
      }
    } catch {
      // geç
    }

    return false;
  }

  // Yönlendirme etkisini ayrı effect’te yap (render saf)
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

