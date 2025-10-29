// src\layouts\AdminLayout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { NAVBAR_HEIGHT } from "@/constants/dimensions";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = location.pathname;

  const handleNavigate = (path: string) => {
    if (path !== activePath) navigate(path);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sol Menü */}
      <Sidebar activePath={activePath} onNavigate={handleNavigate} />

      {/* Sağ İçerik Alanı */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <Navbar />

        {/* Navbar altında kalmasın */}
        <Box
          component="main"
          role="main"
          sx={{
            pt: `${NAVBAR_HEIGHT + 12}px`,
            px: 4,
            pb: 4,
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
