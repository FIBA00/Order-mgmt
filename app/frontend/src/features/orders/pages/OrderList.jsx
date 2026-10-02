import { useState, useMemo } from "react";
import { money } from "../../../utils/money.js";
import { filterOrders } from "../../../utils/order.js";

const STATUS_STYLES = {
  open: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  paid: "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800",
  cancelled: "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
};

export default function OrderList({
  orders = [],
  onSetStatus,
  onSelectOrder
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, { status: statusFilter, search });
  }, [orders, statusFilter, search]);

  const openCount = useMemo(() => {
    return orders.filter(o => o.status === "open").length;
  }, [orders]);

  if (!orders.length) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 dark:text-stone-600 text-sm">
        No orders recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === "all"
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              statusFilter === "open"
                ? "bg-amber-600 dark:bg-amber-500 text-white"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            Open
            {openCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === "open"
                    ? "bg-amber-700 dark:bg-amber-600 text-white"
                    : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300"
                }`}
              >
                {openCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === "paid"
                ? "bg-green-600 text-white"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === "cancelled"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            Cancelled
          </button>
        </div>

        <div className="relative max-w-xs">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order # or note…"
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/80 overflow-hidden shadow-2xs">
        {!filteredOrders.length ? (
          <p className="text-stone-400 dark:text-stone-600 text-xs py-8 text-center">
            No orders match the current filter.
          </p>
        ) : (
          filteredOrders.slice(0, 30).map(order => (
            <div
              key={order.id}
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">
                  #{order.id}
                </span>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {money(order.totalCents)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        STATUS_STYLES[order.status] ||
                        "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.offline && (
                      <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1 py-0.2 rounded font-mono">
                        offline
                      </span>
                    )}
                  </div>
                  {order.note && (
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-xs mt-0.5">
                      {order.note}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-2"
                onClick={e => e.stopPropagation()}
              >
                {order.status === "open" && onSetStatus && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onSetStatus(order.id, "paid")}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded-lg transition"
                    >
                      Mark paid
                    </button>
                    <button
                      onClick={() => onSetStatus(order.id, "cancelled")}
                      className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <span className="text-stone-300 dark:text-stone-600 text-xs pl-1">
                  ›
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
