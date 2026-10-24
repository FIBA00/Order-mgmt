import { useState, useEffect } from "react";
import { Utensils } from "lucide-react";
import { isDesktop } from "../api/client.js";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    if (!isDesktop || !window.desktopAPI?.window) return;

    window.desktopAPI.window.isMaximized().then((max) => {
      setIsMaximized(Boolean(max));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isDesktop || !window.desktopAPI?.app?.onUpdateStatus) return;
    const unsubscribe = window.desktopAPI.app.onUpdateStatus((status) => {
      setUpdateStatus(status);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (!isDesktop) return null;

  async function handleMinimize() {
    try {
      await window.desktopAPI?.window?.minimize();
    } catch (err) {
      console.error("Minimize error:", err);
    }
  }

  async function handleToggleMaximize() {
    try {
      const max = await window.desktopAPI?.window?.maximize();
      setIsMaximized(Boolean(max));
    } catch (err) {
      console.error("Maximize error:", err);
    }
  }

  async function handleClose() {
    try {
      await window.desktopAPI?.window?.close();
    } catch (err) {
      console.error("Close error:", err);
    }
  }

  return (
    <header
      className="flex items-center justify-between h-8 bg-stone-900 text-stone-200 border-b border-stone-800 text-xs select-none z-50 shrink-0"
      style={{ WebkitAppRegion: "drag" }}
    >
      <div className="flex items-center gap-2 px-3 font-semibold tracking-wide text-stone-300">
        <Utensils className="w-3.5 h-3.5 text-amber-500" />
        <span>Restaurant Order Manager</span>
      </div>

      <div className="flex-1 h-full flex items-center justify-center">
        {updateStatus?.status === "downloading" && (
          <span className="text-[11px] text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 animate-pulse">
            Downloading update {updateStatus.percent ? `(${updateStatus.percent}%)` : "..."}
          </span>
        )}
        {updateStatus?.status === "downloaded" && (
          <button
            type="button"
            onClick={() => window.desktopAPI?.app?.installUpdate?.()}
            className="text-[11px] bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-2 py-0.5 rounded transition shadow-sm"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            Restart to update {updateStatus.version ? `(v${updateStatus.version})` : ""}
          </button>
        )}
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <button
          type="button"
          onClick={handleMinimize}
          title="Minimize"
          className="h-full px-3.5 flex items-center justify-center hover:bg-stone-700/60 active:bg-stone-600/70 transition-colors text-stone-300 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleToggleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          className="h-full px-3.5 flex items-center justify-center hover:bg-stone-700/60 active:bg-stone-600/70 transition-colors text-stone-300 hover:text-white"
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="7" y="7" width="13" height="13" rx="1.5" />
              <path d="M4 17V4h13" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleClose}
          title="Close"
          className="h-full px-3.5 flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors text-stone-300 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
