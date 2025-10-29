// Merkezi rota sabitleri ve path yardımcıları
// Not: "as const" sayesinde type-safe kullanım mümkün

export const ROUTES = {
  login: "/login",
  root: "/",
  dashboard: "/dashboard",

  // Donations
  donations: "/donations",
  donationDetail: "/donations/:id",

  // Community
  community: "/community",

  // Notifications
  notifications: "/notifications",

  // Settings / Reports
  settings: "/settings",
  reports: "/reports",

  // 404 fallback amaçlı (istenirse)
  notFoundFallback: "/dashboard",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Dinamik path yardımcıları */
export const paths = {
  donationDetail: (id: string) => `/donations/${encodeURIComponent(id)}`,
} as const;
