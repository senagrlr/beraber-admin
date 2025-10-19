// src/layout/AdminLayout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);

  // URL değişiminde aktif menüyü güncel tut
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    setActivePath(path);
    navigate(path);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar activePath={activePath} onNavigate={handleNavigate} />

      {/* Sağ Ana Alan */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          width: "calc(100vw - 240px)",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            p: 4,
            mt: 8,
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
