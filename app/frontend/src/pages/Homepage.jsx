import { Link } from "react-router-dom";
import { useTheme } from "../utils/theme.js";

export default function Homepage() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex items-center justify-center p-6 relative transition-colors">
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-8 sm:p-10 max-w-md w-full text-center transition-colors">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xl mb-4">
          ☕
        </div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
          Restaurant Order Manager
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-6 text-xs leading-relaxed">
          Fast, minimal order and menu management system crafted for cafes, bistros, and restaurants. Works completely offline.
        </p>
        <Link
          to="/login"
          className="inline-block w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition shadow-xs"
        >
          Open POS Console
        </Link>
      </div>
    </div>
  );
}