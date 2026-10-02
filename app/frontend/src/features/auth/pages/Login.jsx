import { useState } from "react";
import { isDesktop } from "../../../api/client.js";
import { useTheme } from "../../../utils/theme.js";

export default function LoginPage({ onLogin, error }) {
  const { toggleTheme, isDark } = useTheme();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  function handleSubmit(e) {
    e.preventDefault();
    onLogin(username, password);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-4 transition-colors">
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm p-8 sm:p-10 w-full max-w-sm transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-amber-600 dark:bg-amber-500" />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Order Manager
          </h1>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          {isDesktop
            ? "Desktop · Local SQLite"
            : "Web · Local API & Offline Cache"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              Password
            </label>
            <input
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium rounded-xl py-2.5 text-sm transition shadow-xs mt-1"
          >
            Log in to Register
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 text-center">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Demo credentials:{" "}
            <span className="font-mono text-stone-600 dark:text-stone-300">
              admin
            </span>{" "}
            /{" "}
            <span className="font-mono text-stone-600 dark:text-stone-300">
              admin123
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
