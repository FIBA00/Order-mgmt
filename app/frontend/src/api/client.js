const API_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "";
const isDesktop = typeof window !== "undefined" && Boolean(window.desktopAPI);

let onSessionExpired = () => {};

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

// ── Offline storage & fallback helpers ─────────────────────────────────────────

const STORAGE_KEYS = {
  MENU: "restaurant_menu_cache",
  ORDERS: "restaurant_orders_cache",
  QUEUE: "restaurant_sync_queue",
  TOKEN: "token",
  USER: "restaurant_user",
};

function getStored(key, fallback = []) {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    const parsed = JSON.parse(val);
    // Sanitize any legacy hardcoded SEED items (IDs 1-5 with default sample names)
    if (key === STORAGE_KEYS.MENU && Array.isArray(parsed)) {
      const hasLegacySeed = parsed.some(
        (i) =>
          (i.id === 1 && i.name === "Espresso") ||
          (i.id === 2 && i.name === "Cappuccino"),
      );
      if (hasLegacySeed) {
        localStorage.removeItem(key);
        return fallback;
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

// ── HTTP transport with offline-first persistence ─────────────────────────────

function httpApi() {
  let token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  async function request(url, options = {}) {
    const response = await fetch(API_URL + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      token = null;
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      onSessionExpired();
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || body.error || "Request failed");
    }
    return body;
  }

  // Auto-sync queued offline transactions when network is restored
  async function syncOfflineQueue() {
    const queue = getStored(STORAGE_KEYS.QUEUE, []);
    if (!queue.length) return 0;

    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        if (item.type === "create_order") {
          await request("/api/orders", {
            method: "POST",
            body: JSON.stringify(item.payload),
          });
          syncedCount++;
        }
      } catch (err) {
        // Discard permanently unresolvable legacy payloads (e.g. non-existent menu items)
        if (
          err.message?.includes("not found") ||
          err.message?.includes("Validation")
        ) {
          continue;
        }
        remaining.push(item);
      }
    }

    setStored(STORAGE_KEYS.QUEUE, remaining);
    return syncedCount;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      syncOfflineQueue().catch(() => {});
    });
  }

  return {
    auth: {
      async login(credentials) {
        const result = await request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        token = result.token;
        if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        const userObj = result.user || result.data;
        if (userObj) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        }
        return userObj;
      },
      async logout() {
        token = null;
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      },
      async me() {
        if (!token) {
          const stored = localStorage.getItem(STORAGE_KEYS.USER);
          return stored ? JSON.parse(stored) : null;
        }
        try {
          const res = await request("/api/auth/me");
          const userObj = res.user || res.data;
          if (userObj) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
          }
          return userObj;
        } catch {
          const stored = localStorage.getItem(STORAGE_KEYS.USER);
          return stored ? JSON.parse(stored) : null;
        }
      },
    },

    menu: {
      list: async () => {
        try {
          const res = await request("/api/menu");
          const items =
            res.data ?? res.items ?? (Array.isArray(res) ? res : []);
          setStored(STORAGE_KEYS.MENU, items);
          return items;
        } catch {
          return getStored(STORAGE_KEYS.MENU, []);
        }
      },
      create: async (input) => {
        const res = await request("/api/menu", {
          method: "POST",
          body: JSON.stringify(input),
        });
        const item = res.data ?? res.item ?? res;
        const current = getStored(STORAGE_KEYS.MENU, []);
        setStored(STORAGE_KEYS.MENU, [item, ...current]);
        return item;
      },
      update: async (id, input) => {
        try {
          const res = await request(`/api/menu/${id}`, {
            method: "PATCH",
            body: JSON.stringify(input),
          });
          const item = res.data ?? res.item ?? res;
          const current = getStored(STORAGE_KEYS.MENU, []);
          const updated = current.map((m) =>
            m.id === id ? { ...m, ...item } : m,
          );
          setStored(STORAGE_KEYS.MENU, updated);
          return item;
        } catch {
          const current = getStored(STORAGE_KEYS.MENU, []);
          const updated = current.map((m) =>
            m.id === id ? { ...m, ...input } : m,
          );
          setStored(STORAGE_KEYS.MENU, updated);
          return { id, ...input };
        }
      },
      delete: async (id) => {
        await request(`/api/menu/${id}`, { method: "DELETE" });
        const current = getStored(STORAGE_KEYS.MENU, []);
        const filtered = current.filter((item) => item.id !== id);
        setStored(STORAGE_KEYS.MENU, filtered);
        return { success: true };
      },
    },

    orders: {
      list: async () => {
        try {
          const res = await request("/api/orders");
          const orders =
            res.orders ?? res.data ?? (Array.isArray(res) ? res : []);
          setStored(STORAGE_KEYS.ORDERS, orders);
          return orders;
        } catch {
          return getStored(STORAGE_KEYS.ORDERS, []);
        }
      },
      create: async (input) => {
        try {
          const res = await request("/api/orders", {
            method: "POST",
            body: JSON.stringify(input),
          });
          const order = res.order ?? res.data ?? res;
          const current = getStored(STORAGE_KEYS.ORDERS, []);
          setStored(STORAGE_KEYS.ORDERS, [order, ...current]);
          return order;
        } catch {
          // Calculate local order total from cached menu
          const menuItems = getStored(STORAGE_KEYS.MENU, []);
          let totalCents = 0;
          for (const item of input.items || []) {
            const found = menuItems.find((m) => m.id === item.menuItemId);
            totalCents +=
              (found ? found.priceCents : item.priceCents || 0) *
              (item.quantity || 1);
          }

          const localOrder = {
            id: Date.now(),
            items: input.items,
            totalCents,
            status: "open",
            createdAt: new Date().toISOString(),
            offline: true,
          };

          const current = getStored(STORAGE_KEYS.ORDERS, []);
          setStored(STORAGE_KEYS.ORDERS, [localOrder, ...current]);

          const queue = getStored(STORAGE_KEYS.QUEUE, []);
          queue.push({
            type: "create_order",
            payload: input,
            createdAt: Date.now(),
          });
          setStored(STORAGE_KEYS.QUEUE, queue);

          return localOrder;
        }
      },
      setStatus: async (id, status) => {
        try {
          const res = await request(`/api/orders/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          const updated = res.order ?? res.data ?? res;
          const current = getStored(STORAGE_KEYS.ORDERS, []);
          setStored(
            STORAGE_KEYS.ORDERS,
            current.map((o) => (o.id === id ? { ...o, status } : o)),
          );
          return updated;
        } catch {
          const current = getStored(STORAGE_KEYS.ORDERS, []);
          const updated = current.map((o) =>
            o.id === id ? { ...o, status } : o,
          );
          setStored(STORAGE_KEYS.ORDERS, updated);
          return { id, status };
        }
      },
    },

    dashboard: {
      today: async () => {
        try {
          const res = await request("/api/dashboard");
          return res.dashboard ?? res.data ?? res;
        } catch {
          // Aggregate metrics from locally stored orders
          const orders = getStored(STORAGE_KEYS.ORDERS, []);
          const today = new Date().toISOString().slice(0, 10);
          const todaysOrders = orders.filter(
            (o) => !o.createdAt || o.createdAt.startsWith(today),
          );
          const revenueCents = todaysOrders.reduce(
            (sum, o) =>
              o.status !== "cancelled" ? sum + (o.totalCents || 0) : sum,
            0,
          );
          return {
            orderCount: todaysOrders.length,
            revenueCents,
          };
        }
      },
    },

    sync: {
      syncNow: syncOfflineQueue,
      getPendingCount: () => getStored(STORAGE_KEYS.QUEUE, []).length,
      isOnline: () =>
        typeof navigator !== "undefined" ? navigator.onLine : true,
    },
  };
}

// ── Desktop / IPC transport ───────────────────────────────────────────────────

function desktopApi() {
  function guard(fn) {
    return async (...args) => {
      try {
        if (typeof fn !== "function") return null;
        return await fn(...args);
      } catch (error) {
        if (error.message?.includes("Authentication required"))
          onSessionExpired();
        throw error;
      }
    };
  }

  return {
    auth: {
      login: async (...args) => {
        const user = await window.desktopAPI.auth.login(...args);
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
        return user;
      },
      logout: async () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        if (window.desktopAPI.auth?.logout) {
          await window.desktopAPI.auth.logout();
        }
      },
      me: async () => {
        if (window.desktopAPI.auth?.me) {
          return await window.desktopAPI.auth.me();
        }
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        return raw ? JSON.parse(raw) : null;
      },
    },
    menu: {
      list: guard(window.desktopAPI.menu.list),
      create: guard(window.desktopAPI.menu.create),
      update: guard(
        window.desktopAPI.menu.update ||
          (async (id, data) => ({ id, ...data })),
      ),
      delete: guard(window.desktopAPI.menu.delete),
    },
    orders: {
      list: guard(window.desktopAPI.orders.list),
      create: guard(window.desktopAPI.orders.create),
      setStatus: guard(window.desktopAPI.orders.setStatus),
    },
    dashboard: {
      today: guard(window.desktopAPI.dashboard.today),
    },
    sync: {
      syncNow: async () => 0,
      getPendingCount: () => 0,
      isOnline: () => true,
    },
  };
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const api = isDesktop ? desktopApi() : httpApi();
export { isDesktop };
