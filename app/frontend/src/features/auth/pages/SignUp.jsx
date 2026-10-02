import { Link } from "react-router-dom";
import { useTheme } from "../../../utils/theme.js";

export default function SignUpPage() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-6 relative transition-colors">
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-8 w-full max-w-sm text-center transition-colors">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Staff Registration
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
          Staff and cashier accounts are securely provisioned by your system
          administrator.
        </p>
        <Link
          to="/login"
          className="inline-block w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium rounded-xl px-4 py-2.5 text-xs transition shadow-xs"
        >
          Return to Login
        </Link>
      </div>
    </main>
  );
}
