// src/layout/Navbar.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Badge,
} from "@mui/material";
import {
  Person,
  ArrowDropDown,
  Notifications,
} from "@mui/icons-material";
import { COLORS } from "./ui";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getTeamMemberByEmail } from "../services/teamService";
import { listenRecentCompletedDonations } from "../services/donationsService";
import SearchDonations from "../components/SearchDonations";

type MemberInfo = { name: string; role?: string } | null;

export default function Navbar() {
  const navigate = useNavigate();

  // profil menüsü
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const profileOpen = Boolean(anchorEl);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // kullanıcı bilgisi
  const [member, setMember] = useState<MemberInfo>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u?.email) {
        setMember(null);
        return;
      }
      const m = await getTeamMemberByEmail(u.email);
      setMember(m ?? { name: u.email.split("@")[0], role: "—" });
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setAnchorEl(null);
    navigate("/login");
  };

  // tamamlanan bağış bildirimleri
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [completed, setCompleted] = useState<{ id: string; name: string }[]>(
    []
  );
  const notifOpen = Boolean(notifAnchor);
  const handleNotifOpen = (e: React.MouseEvent<SVGSVGElement>) =>
    setNotifAnchor(e.currentTarget as any);
  const handleNotifClose = () => setNotifAnchor(null);

  useEffect(() => {
    const unsub = listenRecentCompletedDonations(10, (rows) => {
      setCompleted(
        rows.map((r) => ({ id: r.id, name: r.name || "(İsimsiz)" }))
      );
    });
    return () => unsub?.();
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 240,
        right: 0,
        height: 64,
        backgroundColor: "#FFFFFF",
        borderBottom: "0.5px solid #F5F2F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 4,
        color: COLORS.textColor,
        zIndex: 1000,
      }}
    >
      {/* 🔍 Arama kutusu (ayrı component) */}
      <SearchDonations width={600} />

      {/* Kullanıcı + Bildirim */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        <Badge color="error" badgeContent={completed.length || null}>
          <Notifications
            sx={{ color: "#5B3B3B", cursor: "pointer" }}
            onClick={handleNotifOpen}
          />
        </Badge>
        <Menu
          anchorEl={notifAnchor}
          open={notifOpen}
          onClose={handleNotifClose}
          PaperProps={{
            elevation: 2,
            sx: {
              mt: 1.5,
              borderRadius: "10px",
              backgroundColor: "#FFF6F6",
              color: "#5B3B3B",
              width: 320,
            },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 700 }}>
            Tamamlanan Bağışlar
          </MenuItem>
          {completed.length === 0 ? (
            <MenuItem disabled>Henüz bildirim yok.</MenuItem>
          ) : (
            completed.map((c) => (
              <MenuItem
                key={c.id}
                onClick={() => {
                  handleNotifClose();
                  navigate(`/donations/${c.id}`);
                }}
              >
                {c.name} —{" "}
                <Typography component="span" sx={{ ml: 0.5, fontWeight: 600 }}>
                  Tamamlandı
                </Typography>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Kullanıcı */}
        <Box
          onClick={handleMenu}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            "&:hover": { opacity: 0.85 },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#D2CECE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5B3B3B",
            }}
          >
            <Person fontSize="small" />
          </Box>
          <Typography sx={{ color: "#5B3B3B", fontWeight: 500 }}>
            {member?.name ?? "—"}
          </Typography>
          <ArrowDropDown sx={{ color: "#5B3B3B" }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={profileOpen}
          onClose={handleClose}
          PaperProps={{
            elevation: 2,
            sx: {
              mt: 1.5,
              borderRadius: "10px",
              backgroundColor: "#FFF6F6",
              color: "#5B3B3B",
              width: 220,
            },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 600 }}>
            {member?.role ?? "Yönetici"}
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{ fontWeight: 600, "&:hover": { backgroundColor: "#FDECEC" } }}
          >
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
