import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DonationsPage from "./pages/Donations/DonationsPage";
import DonationDetail from "./pages/Donations/DonationDetail";
import CommunityPage from "./pages/Community/CommunityPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import { ROUTES } from "@/constants/routes";
import AppErrorBoundary from "./components/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        {/* 🔑 Giriş sayfası (korumasız) */}
        <Route path={ROUTES.login} element={<LoginPage />} />

        {/* 🔒 Tüm yönetici rotaları */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.root} element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />

          {/* Bağışlar */}
          <Route path={ROUTES.donations} element={<DonationsPage />} />
          <Route path={ROUTES.donationDetail} element={<DonationDetail />} />

          {/* Diğer sayfalar */}
          <Route path={ROUTES.community} element={<CommunityPage />} />
          <Route path={ROUTES.notifications} element={<NotificationsPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path={ROUTES.reports} element={<ReportsPage />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Route>
      </Routes>
    </AppErrorBoundary>
  );
}
