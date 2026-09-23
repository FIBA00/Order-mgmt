import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/useAuth";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";

export default function AppRouter() {
  const { user, error, login, logout } = useAuth();

  if (!user) {
    return <LoginPage onLogin={login} error={error} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage user={user} onLogout={logout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
