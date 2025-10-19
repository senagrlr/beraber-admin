// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DonationsPage from "./pages/Donations/DonationsPage";
// ⬇️ Dosya adı DonationDetail.tsx olduğu için bu yolu kullan
import DonationDetail from "./pages/Donations/DonationDetail";
import CommunityPage from "./pages/Community/CommunityPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import ReportsPage from "./pages/Reports/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Bağışlar */}
        <Route path="/donations" element={<DonationsPage />} />
        {/* ⬇️ Detay rotası */}
        <Route path="/donations/:id" element={<DonationDetail />} />

        {/* Diğer sayfalar */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* 404 → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

