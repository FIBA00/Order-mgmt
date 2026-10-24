import { uploadClientLogs } from "../utils/logger.js";

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
  STORE: "restaurant_store_profile",
  CATEGORIES: "restaurant_menu_categories",
};

export const DEFAULT_STORE_PROFILE = {
  name: "The Artisan Roast Cafe",
  address: "123 Coffee Lane, Suite 100",
  phone: "(555) 234-5678",
  taxRatePercent: 8.5,
  currency: "$",
  receiptHeader: "Welcome to The Artisan Roast Cafe",
  receiptFooter: "Thank you for dining with us! Come back soon.",
};

function getStoreProfile() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.STORE);
    return val
      ? { ...DEFAULT_STORE_PROFILE, ...JSON.parse(val) }
      : DEFAULT_STORE_PROFILE;
  } catch {
    return DEFAULT_STORE_PROFILE;
  }
}

function saveStoreProfile(profile) {
  try {
    const updated = { ...getStoreProfile(), ...profile };
    localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(updated));
    return updated;
  } catch {
    return profile;
  }
}

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
      async signup(credentials) {
        const result = await request("/api/auth/signup", {
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
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        try {
          const res = await request("/api/menu");
          const raw =
            res.data ?? res.items ?? (Array.isArray(res) ? res : []);
          const items = raw.map((item) => ({
            ...item,
            category: item.category || catMap[item.id] || "Food",
          }));
          setStored(STORAGE_KEYS.MENU, items);
          return items;
        } catch {
          const cached = getStored(STORAGE_KEYS.MENU, []);
          return cached.map((item) => ({
            ...item,
            category: item.category || catMap[item.id] || "Food",
          }));
        }
      },
      create: async (input) => {
        const res = await request("/api/menu", {
          method: "POST",
          body: JSON.stringify(input),
        });
        const raw = res.data ?? res.item ?? res;
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        if (input.category && raw?.id) {
          catMap[raw.id] = input.category;
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
        }
        const item = {
          ...raw,
          category: input.category || raw.category || "Food",
        };
        const current = getStored(STORAGE_KEYS.MENU, []);
        setStored(STORAGE_KEYS.MENU, [item, ...current]);
        return item;
      },
      update: async (id, input) => {
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        if (input.category) {
          catMap[id] = input.category;
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
        }
        try {
          const res = await request(`/api/menu/${id}`, {
            method: "PATCH",
            body: JSON.stringify(input),
          });
          const raw = res.data ?? res.item ?? res;
          const item = {
            ...raw,
            category: input.category || raw.category || catMap[id] || "Food",
          };
          const current = getStored(STORAGE_KEYS.MENU, []);
          const updated = current.map((m) =>
            m.id === id ? { ...m, ...item } : m,
          );
          setStored(STORAGE_KEYS.MENU, updated);
          return item;
        } catch {
          const current = getStored(STORAGE_KEYS.MENU, []);
          const updated = current.map((m) =>
            m.id === id
              ? { ...m, ...input, category: input.category || catMap[id] || "Food" }
              : m,
          );
          setStored(STORAGE_KEYS.MENU, updated);
          return { id, ...input, category: input.category || catMap[id] || "Food" };
        }
      },
      delete: async (id) => {
        await request(`/api/menu/${id}`, { method: "DELETE" });
        const current = getStored(STORAGE_KEYS.MENU, []);
        const filtered = current.filter((item) => item.id !== id);
        setStored(STORAGE_KEYS.MENU, filtered);
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        if (catMap[id]) {
          delete catMap[id];
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
        }
        return { success: true };
      },
    },

    orders: {
      list: async () => {
        try {
          const res = await request("/api/orders");
          const orders =
            res.orders ?? res.data ?? (Array.isArray(res) ? res : []);
          const notesMap = getStored("restaurant_order_notes", {});
          const itemsMap = getStored("restaurant_order_items", {});
          const enriched = orders.map((o) => ({
            ...o,
            note: o.note || notesMap[o.id] || "",
            items: o.items || itemsMap[o.id] || [],
          }));
          setStored(STORAGE_KEYS.ORDERS, enriched);
          return enriched;
        } catch {
          return getStored(STORAGE_KEYS.ORDERS, []);
        }
      },
      get: async (id) => {
        try {
          const res = await request(`/api/orders/${id}`);
          const order = res.order ?? res.data ?? res;
          if (order) {
            const notesMap = getStored("restaurant_order_notes", {});
            const itemsMap = getStored("restaurant_order_items", {});
            order.note = order.note || notesMap[order.id] || "";
            if (!order.items || !order.items.length) {
              order.items = itemsMap[order.id] || [];
            }
          }
          return order;
        } catch {
          const orders = getStored(STORAGE_KEYS.ORDERS, []);
          return orders.find((o) => o.id === id) || null;
        }
      },
      create: async (input) => {
        try {
          const res = await request("/api/orders", {
            method: "POST",
            body: JSON.stringify(input),
          });
          const order = res.order ?? res.data ?? res;
          if (input.items && order) {
            order.items = input.items;
            const itemsMap = getStored("restaurant_order_items", {});
            itemsMap[order.id] = input.items;
            setStored("restaurant_order_items", itemsMap);
          }
          if (input.note && order) {
            order.note = input.note;
            const notesMap = getStored("restaurant_order_notes", {});
            notesMap[order.id] = input.note;
            setStored("restaurant_order_notes", notesMap);
          }
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

          const currentUser = getStored(STORAGE_KEYS.USER, null);
          const localOrder = {
            id: Date.now(),
            items: input.items,
            totalCents,
            note: input.note || "",
            status: "open",
            username: currentUser ? currentUser.username : "Staff",
            createdAt: new Date().toISOString(),
            offline: true,
          };

          if (input.items) {
            const itemsMap = getStored("restaurant_order_items", {});
            itemsMap[localOrder.id] = input.items;
            setStored("restaurant_order_items", itemsMap);
          }

          if (input.note) {
            const notesMap = getStored("restaurant_order_notes", {});
            notesMap[localOrder.id] = input.note;
            setStored("restaurant_order_notes", notesMap);
          }

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
          const todaysOrders = orders.filter((o) => {
            if (!o.createdAt) return true;
            try {
              const d =
                o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
              return !Number.isNaN(d.getTime())
                ? d.toISOString().slice(0, 10) === today
                : true;
            } catch {
              return true;
            }
          });
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

    staff: {
      list: async () => {
        try {
          const res = await request("/api/auth/users");
          const users = res.staff ?? res.data ?? (Array.isArray(res) ? res : []);
          setStored("restaurant_staff_cache", users);
          return users;
        } catch {
          return getStored("restaurant_staff_cache", []);
        }
      },
      create: async (input) => {
        const res = await request("/api/auth/users", {
          method: "POST",
          body: JSON.stringify(input),
        });
        const user = res.user ?? res.data ?? res;
        const current = getStored("restaurant_staff_cache", []);
        setStored("restaurant_staff_cache", [...current, user]);
        return user;
      },
      delete: async (id) => {
        await request(`/api/auth/users/${id}`, { method: "DELETE" });
        const current = getStored("restaurant_staff_cache", []);
        setStored(
          "restaurant_staff_cache",
          current.filter((u) => u.id !== id),
        );
        return { success: true };
      },
    },

    store: {
      get: () => getStoreProfile(),
      save: (profile) => saveStoreProfile(profile),
    },

    sync: {
      syncNow: syncOfflineQueue,
      getPendingCount: () => getStored(STORAGE_KEYS.QUEUE, []).length,
      isOnline: () =>
        typeof navigator !== "undefined" ? navigator.onLine : true,
    },

    logs: {
      upload: (targetUrl) => uploadClientLogs(targetUrl),
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
      signup: async (credentials) => {
        if (window.desktopAPI?.auth?.createUser) {
          const user = await window.desktopAPI.auth.createUser(credentials);
          if (user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          }
          return user;
        }
        return null;
      },
      me: async () => {
        try {
          if (window.desktopAPI?.auth?.me) {
            return await window.desktopAPI.auth.me();
          }
        } catch {
          return null;
        }
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        return raw ? JSON.parse(raw) : null;
      },
    },
    staff: {
      list: guard(window.desktopAPI?.auth?.listUsers),
      create: guard(window.desktopAPI?.auth?.createUser),
      delete: guard(window.desktopAPI?.auth?.deleteUser),
    },
    menu: {
      list: async () => {
        const raw = await guard(window.desktopAPI.menu.list)();
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        const items = Array.isArray(raw) ? raw : [];
        return items.map((item) => ({
          ...item,
          category: item.category || catMap[item.id] || "Food",
        }));
      },
      create: async (input) => {
        const item = await guard(window.desktopAPI.menu.create)(input);
        if (input.category && item?.id) {
          const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
          catMap[item.id] = input.category;
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
          item.category = input.category;
        }
        return item;
      },
      update: async (id, data) => {
        if (data.category) {
          const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
          catMap[id] = data.category;
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
        }
        const updated = await guard(
          window.desktopAPI.menu.update ||
            (async (targetId, updates) => ({ id: targetId, ...updates })),
        )(id, data);
        return {
          ...updated,
          category: data.category || updated?.category || "Food",
        };
      },
      delete: async (id) => {
        const result = await guard(window.desktopAPI.menu.delete)(id);
        const catMap = getStored(STORAGE_KEYS.CATEGORIES, {});
        if (catMap[id]) {
          delete catMap[id];
          setStored(STORAGE_KEYS.CATEGORIES, catMap);
        }
        return result;
      },
    },
    orders: {
      list: async () => {
        const raw = await guard(window.desktopAPI.orders.list)();
        const notesMap = getStored("restaurant_order_notes", {});
        const itemsMap = getStored("restaurant_order_items", {});
        const orders = Array.isArray(raw) ? raw : [];
        return orders.map((o) => ({
          ...o,
          note: o.note || notesMap[o.id] || "",
          items: o.items || itemsMap[o.id] || [],
        }));
      },
      get: async (id) => {
        const order = await guard(window.desktopAPI?.orders?.get)(id);
        if (order) {
          const notesMap = getStored("restaurant_order_notes", {});
          const itemsMap = getStored("restaurant_order_items", {});
          order.note = order.note || notesMap[order.id] || "";
          if (!order.items || !order.items.length) {
            order.items = itemsMap[order.id] || [];
          }
          return order;
        }
        const orders = getStored(STORAGE_KEYS.ORDERS, []);
        return orders.find((o) => o.id === id) || null;
      },
      create: async (input) => {
        const order = await guard(window.desktopAPI.orders.create)(input);
        if (input.items && order) {
          order.items = input.items;
          const itemsMap = getStored("restaurant_order_items", {});
          itemsMap[order.id] = input.items;
          setStored("restaurant_order_items", itemsMap);
        }
        if (input.note && order) {
          order.note = input.note;
          const notesMap = getStored("restaurant_order_notes", {});
          notesMap[order.id] = input.note;
          setStored("restaurant_order_notes", notesMap);
        }
        return order;
      },
      setStatus: guard(window.desktopAPI.orders.setStatus),
    },
    dashboard: {
      today: guard(window.desktopAPI.dashboard.today),
    },
    store: {
      get: () => getStoreProfile(),
      save: (profile) => saveStoreProfile(profile),
    },
    sync: {
      syncNow: async () => 0,
      getPendingCount: () => 0,
      isOnline: () => true,
    },
    logs: {
      upload: async (targetUrl) => {
        if (window.desktopAPI?.app?.uploadLogs) {
          return await window.desktopAPI.app.uploadLogs(targetUrl);
        }
        return await uploadClientLogs(targetUrl);
      },
    },
  };
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const api = isDesktop ? desktopApi() : httpApi();
export { isDesktop };
