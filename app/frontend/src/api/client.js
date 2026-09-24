const isDesktop = typeof window !== "undefined" && Boolean(window.desktopAPI);

let onSessionExpired = () => {};

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

// ── HTTP transport ────────────────────────────────────────────────────────────

function httpApi() {
  let token = localStorage.getItem("token");

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    if (response.status === 401) {
      token = null;
      localStorage.removeItem("token");
      onSessionExpired();
    }

    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Request failed");
    return body;
  }

  return {
    auth: {
      async login(credentials) {
        const result = await request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials)
        });
        token = result.token;
        localStorage.setItem("token", token);
        return result.user;
      },
      async logout() {
        token = null;
        localStorage.removeItem("token");
      }
    },
    menu: {
      list:   async ()      => (await request("/api/menu")).items,
      create: async input   => (await request("/api/menu", { method: "POST", body: JSON.stringify(input) })).item
    },
    orders: {
      list:      async ()      => (await request("/api/orders")).orders,
      create:    async input   => (await request("/api/orders", { method: "POST", body: JSON.stringify(input) })).order,
      setStatus: async (id, status) =>
        (await request(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })).order
    },
    dashboard: {
      today: async () => (await request("/api/dashboard")).dashboard
    }
  };
}

// ── Desktop / IPC transport ───────────────────────────────────────────────────

function desktopApi() {
  function guard(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error.message?.includes("Authentication required")) onSessionExpired();
        throw error;
      }
    };
  }

  return {
    auth: window.desktopAPI.auth,
    menu: {
      list:   guard(window.desktopAPI.menu.list),
      create: guard(window.desktopAPI.menu.create)
    },
    orders: {
      list:      guard(window.desktopAPI.orders.list),
      create:    guard(window.desktopAPI.orders.create),
      setStatus: guard(window.desktopAPI.orders.setStatus)
    },
    dashboard: {
      today: guard(window.desktopAPI.dashboard.today)
    }
  };
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const api = isDesktop ? desktopApi() : httpApi();
export { isDesktop };
