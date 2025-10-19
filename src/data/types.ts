// src/data/types.ts

export enum PagePath {
  Dashboard = '/dashboard',
  Donations = '/donations',
  Community = '/community',
  Notifications = '/notifications',
  Settings = '/settings',
  Reports = '/reports',
}

export interface NavItem {
  name: string;
  icon: string;
  path: PagePath;
}

export interface PanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}
