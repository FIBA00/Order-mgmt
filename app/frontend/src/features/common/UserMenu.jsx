import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Coffee,
  CircleDollarSign,
  Users,
  LogOut,
} from "lucide-react";

export default function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const initial = (user.username?.[0] || "U").toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <div className="relative">
      {/* Circular Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        title={`Account: ${user.username} (${user.role})`}
        aria-label="User account menu"
      >
        {initial}
      </button>

      {/* Backdrop to close on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Consolidated Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 transition-colors animate-in fade-in duration-100">
          {/* User Profile Header */}
          <div className="p-3.5 flex items-center gap-3 bg-stone-50/60 dark:bg-stone-800/40">
            <div className="w-9 h-9 rounded-full bg-amber-600 dark:bg-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {user.username}
              </span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                {isAdmin ? "Administrator" : "Cashier"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <ClipboardList className="w-4 h-4 text-stone-400" /> POS Register
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/menu"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <Coffee className="w-4 h-4 text-stone-400" /> Menu Catalog
                </Link>
                <Link
                  to="/finances"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <CircleDollarSign className="w-4 h-4 text-stone-400" /> Finance
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <Users className="w-4 h-4 text-stone-400" /> Staff & Settings
                </Link>
              </>
            )}
          </div>

          {/* Actions & Logout */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <LogOut className="w-4 h-4 text-red-500" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
