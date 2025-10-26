// src/layout/Sidebar.tsx
import { Box } from "@mui/material";
import { navItems } from "./ui";
import { COLORS } from "@/constants/colors";
import logo from "../assets/beraber_logo2.png";

type Props = {
  activePath: string;
  onNavigate: (path: string) => void;
};

export default function Sidebar({ activePath, onNavigate }: Props) {
  const isActivePath = (itemPath: string) => {
    if (itemPath === "/") return activePath === "/";
    return activePath === itemPath || activePath.startsWith(itemPath + "/");
  };

  const handleClick = (path: string) => {
    if (!isActivePath(path)) onNavigate(path);
  };

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
          onClick={() => handleClick("/dashboard")}
          role="button"
          aria-label="Dashboard'a dön"
        />
      </Box>

      {/* Menü */}
      {navItems.map((item) => {
        const active = isActivePath(item.path);
        const Icon = item.icon;
        return (
          <Box
            key={item.path}
            onClick={() => handleClick(item.path)}
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
              backgroundColor: active ? COLORS.sidebarActiveBg : "transparent",
              color: active ? COLORS.sidebarActiveText : COLORS.textColor,
              "&:hover": { color: COLORS.sidebarHover },
            }}
            role="button"
            aria-current={active ? "page" : undefined}
            aria-label={item.name}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: active ? COLORS.sidebarActiveText : COLORS.textColor,
              }}
            >
              <Icon />
            </Box>
            <span style={{ fontWeight: active ? 700 : 600 }}>{item.name}</span>
          </Box>
        );
      })}
    </Box>
  );
}
