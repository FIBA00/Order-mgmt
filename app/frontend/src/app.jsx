import { Routes, Route, Navigate } from "react-router-dom";

// ── Auth & Feature Imports ──────────────────────────────────────────────────
import { useAuth } from "./features/auth/useAuth.js";
import LoginPage from "./features/auth/pages/Login.jsx";
import SignUpPage from "./features/auth/pages/SignUp.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MenuManagementPage from "./pages/MenuManagementPage.jsx";
import Homepage from "./pages/Homepage.jsx";

export default function AppRouter() {
  const { user, error, login, logout } = useAuth();

  return (
    <Routes>
      <Route path="/home" element={<Homepage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={login} error={error} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <DashboardPage user={user} onLogout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/menu"
        element={
          user ? (
            <MenuManagementPage user={user} onLogout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
