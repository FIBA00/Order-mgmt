import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { money } from "../../utils/money";
import MenuList from "../menu/MenuList";
import OrderList from "../orders/OrderList";

export default function DashboardPage({ user, onLogout }) {
  const [menu, setMenu]           = useState([]);
  const [orders, setOrders]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [message, setMessage]     = useState("");
  const [loading, setLoading]     = useState(true);

  const refresh = useCallback(async () => {
    const [items, orderList, today] = await Promise.all([
      api.menu.list(),
      api.orders.list(),
      api.dashboard.today()
    ]);
    setMenu(items);
    setOrders(orderList);
    setStats(today);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleOrder(item) {
    try {
      await api.orders.create({ items: [{ menuItemId: item.id, quantity: 1 }] });
      await refresh();
      setMessage(`Order for ${item.name} created`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSetStatus(id, status) {
    try {
      await api.orders.setStatus(id, status);
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Order Manager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user.username}
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {user.role}
            </span>
          </span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Orders today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.orderCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Revenue today</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{money(stats.revenueCents)}</p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {message && (
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
            {message}
          </p>
        )}

        {/* Menu */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Menu</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <MenuList items={menu} onOrder={handleOrder} />
          )}
        </section>

        {/* Orders */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Orders</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <OrderList orders={orders} onSetStatus={handleSetStatus} />
          )}
        </section>
      </main>
    </div>
  );
}
