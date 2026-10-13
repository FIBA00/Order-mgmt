import { Routes, Route, Navigate } from "react-router-dom";

// ── Auth & Feature Imports ──────────────────────────────────────────────────
import { useAuth } from "./features/auth/useAuth.js";
import LoginPage from "./features/auth/pages/Login.jsx";
import SignUpPage from "./features/auth/pages/SignUp.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MenuManagementPage from "./pages/MenuManagementPage.jsx";
import AdminConsolePage from "./pages/AdminConsolePage.jsx";
import FinancesPage from "./pages/FinancesPage.jsx";
import Homepage from "./pages/Homepage.jsx";
import TitleBar from "./components/TitleBar.jsx";

export default function AppRouter() {
  const { user, error, login, signup, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/home" element={<Homepage />} />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SignUpPage onSignUp={signup} error={error} />
              )
            }
          />
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
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === "admin" ? (
                <MenuManagementPage user={user} onLogout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/finances"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === "admin" ? (
                <FinancesPage user={user} onLogout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/finance"
            element={<Navigate to="/finances" replace />}
          />
          <Route
            path="/admin"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === "admin" ? (
                <AdminConsolePage user={user} onLogout={logout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
