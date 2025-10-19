// src/layout/Sidebar.tsx
// src/layouts/Sidebar.tsx
import { Box } from "@mui/material";
import { COLORS, navItems } from "./ui";
import logo from "../assets/beraber_logo2.png";

type Props = {
  activePath: string;
  onNavigate: (path: string) => void;
};

export default function Sidebar({ activePath, onNavigate }: Props) {
  return (
    <Box
      sx={{
        width: 240,
        backgroundColor: COLORS.lightBg,
        p: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mt: -5.5,
          mb: -1,
          pl: 4,
        }}
      >
        <Box
          component="img"
          src={logo}
          sx={{ width: 120, height: "auto", cursor: "pointer" }}
          onClick={() => onNavigate("/dashboard")}
        />
      </Box>

      {/* Menü */}
      {navItems.map((item) => {
        const isActive = activePath === item.path;
        const Icon = item.icon; // <-- burada render ediyoruz
        return (
          <Box
            key={item.path}
            onClick={() => onNavigate(item.path)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.6,
              px: 2,
              borderRadius: "10px",
              mb: 0.5,
              cursor: "pointer",
              transition: "0.2s",
              backgroundColor: isActive ? COLORS.sidebarActiveBg : "transparent",
              color: isActive ? COLORS.sidebarActiveText : COLORS.textColor,
              "&:hover": { color: COLORS.sidebarHover },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: isActive ? COLORS.sidebarActiveText : COLORS.textColor,
              }}
            >
              <Icon />
            </Box>
            <span style={{ fontWeight: isActive ? 700 : 600 }}>{item.name}</span>
          </Box>
        );
      })}
    </Box>
  );
}
