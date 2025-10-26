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

export type NavItem = {
  name: string;
  icon: SvgIconComponent; // Sadece ikon tipi
  path: string;
};

export const navItems: NavItem[] = [
  { name: "Dashboard",   icon: DashboardIcon,     path: "/dashboard" },
  { name: "Bağışlar",    icon: StarIcon,          path: "/donations" },
  { name: "Topluluk",    icon: GroupIcon,         path: "/community" },
  { name: "Bildirimler", icon: NotificationsIcon, path: "/notifications" },
  { name: "Ayarlar",     icon: SettingsIcon,      path: "/settings" },
  { name: "Raporlar",    icon: AssessmentIcon,    path: "/reports" },
];
