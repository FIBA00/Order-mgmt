import React from "react"

const isDesktop = typeof window !== "undefined" && Boolean(window.desktopAPI);

// Called whenever a request comes back 401 (expired/invalid token) or the
// desktop session is gone, so the UI can drop back to the login screen
// instead of failing silently on every subsequent action.
let onSessionExpired = () => {};

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
      list: async () => (await request("/api/menu")).items
    },
    orders: {
      list: async () => (await request("/api/orders")).orders,
      create: async input => (await request("/api/orders", {
        method: "POST",
        body: JSON.stringify(input)
      })).order
    },
    dashboard: {
      today: async () => (await request("/api/dashboard")).dashboard
    }
  };
}

function desktopApi() {
  // The main process throws "Authentication required" once currentUser is
  // cleared (logout, or the session was never established). Surface that
  // the same way the HTTP client surfaces a 401.
  function guard(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error.message?.includes("Authentication required")) {
          onSessionExpired();
        }
        throw error;
      }
    };
  }

  return {
    auth: window.desktopAPI.auth,
    menu: {
      list: guard(window.desktopAPI.menu.list),
      create: guard(window.desktopAPI.menu.create)
    },
    orders: {
      list: guard(window.desktopAPI.orders.list),
      create: guard(window.desktopAPI.orders.create),
      setStatus: guard(window.desktopAPI.orders.setStatus)
    },
    dashboard: {
      today: guard(window.desktopAPI.dashboard.today)
    }
  };
}

const api = isDesktop ? desktopApi() : httpApi();

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("admin123");
  const [menu, setMenu] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [dashboard, setDashboard] = React.useState(null);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    onSessionExpired = () => {
      setUser(null);
      setMessage("Session expired — please log in again");
    };
    return () => { onSessionExpired = () => {}; };
  }, []);

  async function logout() {
    await api.auth.logout();
    setUser(null);
    setMenu([]);
    setOrders([]);
    setDashboard(null);
  }

  async function login(event) {
    event.preventDefault();
    try {
      const loggedIn = await api.auth.login({ username, password });
      setUser(loggedIn);
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function refresh() {
    const [items, existingOrders, today] = await Promise.all([
      api.menu.list(),
      api.orders.list(),
      api.dashboard.today()
    ]);
    setMenu(items);
    setOrders(existingOrders);
    setDashboard(today);
  }

  async function createOrder(menuItem) {
    try {
      // userId is derived server-side from the authenticated session
      // (JWT on web, tracked IPC session on desktop) — never sent by the client.
      await api.orders.create({
        items: [{ menuItemId: menuItem.id, quantity: 1 }]
      });
      await refresh();
      setMessage("Order created");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return React.createElement(
      "main",
      { style: { maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif" } },
      React.createElement("h1", null, "Restaurant Order Manager"),
      React.createElement("p", null, isDesktop ? "Desktop / Offline" : "Web / Local API"),
      React.createElement(
        "form",
        { onSubmit: login },
        React.createElement("input", {
          value: username,
          onChange: e => setUsername(e.target.value),
          placeholder: "Username"
        }),
        React.createElement("br"),
        React.createElement("input", {
          value: password,
          onChange: e => setPassword(e.target.value),
          type: "password",
          placeholder: "Password"
        }),
        React.createElement("br"),
        React.createElement("button", { type: "submit" }, "Login")
      ),
      React.createElement("p", null, message),
      React.createElement("small", null, "Demo: admin / admin123")
    );
  }

  return React.createElement(
    "main",
    { style: { padding: 32, fontFamily: "sans-serif" } },
    React.createElement("h1", null, "Restaurant Dashboard"),
    React.createElement(
      "p",
      null,
      `Logged in as ${user.username} (${user.role}) `,
      React.createElement("button", { onClick: logout }, "Log out")
    ),
    dashboard && React.createElement(
      "section",
      null,
      React.createElement("strong", null, `Today's orders: ${dashboard.orderCount}`),
      React.createElement("br"),
      React.createElement("strong", null, `Revenue: ${money(dashboard.revenueCents)}`)
    ),
    React.createElement("h2", null, "Menu"),
    React.createElement(
      "div",
      null,
      menu.map(item =>
        React.createElement(
          "button",
          {
            key: item.id,
            onClick: () => createOrder(item),
            style: { margin: 6, padding: 12 }
          },
          `${item.name} — ${money(item.priceCents)}`
        )
      )
    ),
    React.createElement("h2", null, "Recent Orders"),
    React.createElement(
      "ul",
      null,
      orders.slice(0, 10).map(order =>
        React.createElement(
          "li",
          { key: order.id },
          `#${order.id} — ${money(order.totalCents)} — ${order.status}`
        )
      )
    ),
    React.createElement("p", null, message)
  );
}
