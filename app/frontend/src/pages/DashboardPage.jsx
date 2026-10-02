import { useState, useEffect, useCallback, useMemo } from "react";

// ── Internal imports ──────────────────────────────────────────────────────────
import { api, isDesktop } from "../api/client.js";
import { money } from "../utils/money.js";
import { useTheme } from "../utils/theme.js";

import MenuList from "../features/menu/pages/MenuList.jsx";
import OrderList from "../features/orders/pages/OrderList.jsx";
import CurrentTicket from "../features/orders/pages/CurrentTicket.jsx";
import OrderDetailsModal from "../features/orders/pages/OrderDetailsModal.jsx";

export default function DashboardPage({ user, onLogout }) {
  const { theme, toggleTheme, isDark } = useTheme();

  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [ticketItems, setTicketItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(
    api.sync ? api.sync.getPendingCount() : 0
  );
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [items, orderList, today] = await Promise.all([
        api.menu.list(),
        api.orders.list(),
        api.dashboard.today()
      ]);
      setMenu(items);
      setOrders(orderList);
      setStats(today);
      if (api.sync) {
        setPendingSyncCount(api.sync.getPendingCount());
      }
    } catch (err) {
      setMessage(`Refresh error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    function handleOnlineStatus() {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online && api.sync) {
        handleManualSync();
      }
    }

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [refresh]);

  async function handleManualSync() {
    if (!api.sync) return;
    setSyncing(true);
    try {
      const synced = await api.sync.syncNow();
      if (synced > 0) {
        setMessage(`Synchronized ${synced} offline order(s) with central server.`);
      }
      await refresh();
    } catch (err) {
      setMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  // ── POS Ticket / Cart Operations ─────────────────────────────────────────────

  function handleAddToTicket(item) {
    setTicketItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          priceCents: item.priceCents,
          quantity: 1
        }
      ];
    });
  }

  function handleUpdateTicketQuantity(menuItemId, delta) {
    setTicketItems(prev => {
      return prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  }

  function handleRemoveFromTicket(menuItemId) {
    setTicketItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
  }

  function handleClearTicket() {
    setTicketItems([]);
  }

  async function handlePlaceOrder(note) {
    if (!ticketItems.length) return;
    setPlacingOrder(true);
    try {
      const payload = {
        items: ticketItems.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          name: i.name,
          priceCents: i.priceCents
        })),
        note: note || undefined
      };
      await api.orders.create(payload);
      setTicketItems([]);
      await refresh();
      setMessage("Order placed successfully.");
    } catch (err) {
      setMessage(`Failed to place order: ${err.message}`);
    } finally {
      setPlacingOrder(false);
    }
  }

  // ── Order & Menu Actions ───────────────────────────────────────────────────

  async function handleSetStatus(id, status) {
    try {
      await api.orders.setStatus(id, status);
      await refresh();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => (prev ? { ...prev, status } : null));
      }
      setMessage(`Order #${id} marked as ${status}.`);
    } catch (err) {
      setMessage(`Status update error: ${err.message}`);
    }
  }

  async function handleCreateMenuItem(input) {
    try {
      await api.menu.create(input);
      await refresh();
      setMessage(`Added menu item "${input.name}".`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDeleteMenuItem(id) {
    try {
      await api.menu.delete(id);
      await refresh();
      setMessage("Menu item removed.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Derived metrics
  const openOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === "open").length;
  }, [orders]);

  const averageOrderValue = useMemo(() => {
    if (!stats || !stats.orderCount) return 0;
    return Math.round(stats.revenueCents / stats.orderCount);
  }, [stats]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-150">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-500" />
            <h1 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Order Manager
            </h1>
          </div>

          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isOnline
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            {isDesktop ? "Desktop Mode" : isOnline ? "Online" : "Offline Mode"}
          </span>

          {pendingSyncCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              className="text-xs bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-0.5 rounded-full transition disabled:opacity-50"
            >
              {syncing
                ? "Syncing…"
                : `${pendingSyncCount} pending sync · Sync now`}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm transition"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <span className="text-xs text-stone-500 dark:text-stone-400">
            {user.username}
            <span className="ml-1.5 text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full uppercase font-medium">
              {user.role}
            </span>
          </span>

          <button
            onClick={onLogout}
            className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 flex-1">
        {/* Metric Cards Banner */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
              <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                Orders Today
              </p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {stats.orderCount ?? 0}
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
              <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                Revenue Today
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">
                {money(stats.revenueCents ?? 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
              <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                Avg Ticket Value
              </p>
              <p className="text-2xl font-bold text-stone-800 dark:text-stone-200 mt-1">
                {money(averageOrderValue)}
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
              <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                Active Open Tickets
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">
                {openOrdersCount}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Alert Banner */}
        {message && (
          <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* POS Workspace: Menu (left) & Current Ticket (right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Menu Catalog
              </h2>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Click item to add to ticket
              </span>
            </div>
            {loading ? (
              <p className="text-xs text-stone-400 py-6">Loading menu items…</p>
            ) : (
              <MenuList
                items={menu}
                onSelectItem={handleAddToTicket}
                isAdmin={user.role === "admin"}
                onCreateItem={handleCreateMenuItem}
                onDeleteItem={handleDeleteMenuItem}
              />
            )}
          </div>

          <div className="lg:col-span-5 sticky top-20">
            <CurrentTicket
              items={ticketItems}
              onUpdateQuantity={handleUpdateTicketQuantity}
              onRemove={handleRemoveFromTicket}
              onClear={handleClearTicket}
              onSubmit={handlePlaceOrder}
              submitting={placingOrder}
            />
          </div>
        </section>

        {/* Orders Stream Section */}
        <section className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Recent Orders & Tickets
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              Click order to inspect details & receipt
            </span>
          </div>
          {loading ? (
            <p className="text-xs text-stone-400 py-6">Loading orders…</p>
          ) : (
            <OrderList
              orders={orders}
              onSetStatus={handleSetStatus}
              onSelectOrder={setSelectedOrder}
            />
          )}
        </section>
      </main>

      {/* Itemized Order Details & Receipt Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          menuItems={menu}
          onClose={() => setSelectedOrder(null)}
          onSetStatus={handleSetStatus}
        />
      )}
    </div>
  );
}
