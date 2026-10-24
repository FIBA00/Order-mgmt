const STORAGE_KEY = "restaurant_client_logs";
const MAX_LOGS = 100;

function getBufferedLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logClient(level, message, meta = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: String(message),
    meta: meta ? (meta.stack || String(meta)) : undefined,
  };
  try {
    const logs = getBufferedLogs();
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
}

export async function uploadClientLogs(targetUrl = "/api/logs/upload") {
  const entries = getBufferedLogs();
  if (!entries.length) return { success: true, count: 0 };

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "frontend", entries }),
    });
    if (res.ok) {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true, count: entries.length };
    }
    return { success: false, status: res.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Global exception interceptor
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logClient("error", event.message, event.error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    logClient("error", "Unhandled rejection", event.reason);
  });
}
