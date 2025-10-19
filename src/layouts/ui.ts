// src/layouts/ui.ts
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  type SvgIconComponent,
} from "@mui/icons-material";

export const COLORS = {
  mainRed: "#B60707",
  lightBg: "#FFF6F6",
  textColor: "#C9AEB0",
  sidebarActiveBg: "#F2E7E7",
  sidebarActiveText: "#A1070A",
  sidebarHover: "#C9A7A8",
  searchBg: "#FBF6F6",
  searchIcon: "#627B87",
};

export type NavItem = {
  name: string;
  icon: SvgIconComponent; // <-- component tipi
  path: string;
};

export const navItems: NavItem[] = [
  { name: "Dashboard",   icon: DashboardIcon,   path: "/dashboard" },
  { name: "Bağışlar",    icon: StarIcon,        path: "/donations" },
  { name: "Topluluk",    icon: GroupIcon,       path: "/community" },
  { name: "Bildirimler", icon: NotificationsIcon, path: "/notifications" },
  { name: "Ayarlar",     icon: SettingsIcon,    path: "/settings" },
  { name: "Raporlar",    icon: AssessmentIcon,  path: "/reports" },
];
