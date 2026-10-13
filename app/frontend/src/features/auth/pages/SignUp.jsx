import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../../utils/theme.js";

export default function SignUpPage({ onSignUp, error: propError }) {
  const { toggleTheme, isDark } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (onSignUp) {
      onSignUp(username, password, role);
    }
  }

  const errorMessage = localError || propError;

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-4 transition-colors">
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm p-8 sm:p-10 w-full max-w-sm transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-amber-600 dark:bg-amber-500" />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Initial Setup
          </h1>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          Create an administrator or staff account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Username
            </label>
            <input
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Account Role
            </label>
            <select
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Administrator</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Password
            </label>
            <input
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Confirm Password
            </label>
            <input
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2.5 rounded-xl">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium rounded-xl py-2.5 text-sm transition shadow-xs mt-1"
          >
            Create Account & Enter
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 text-center">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-amber-600 dark:text-amber-400 font-medium hover:underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
