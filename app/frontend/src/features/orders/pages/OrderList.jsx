import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Utensils,
  ShoppingBag,
  X,
  Clock,
  User,
  Tag,
  Coffee,
} from "lucide-react";
import { money } from "../../../utils/money.js";
import { filterOrders, parseOrderDetails } from "../../../utils/order.js";
import ConfirmModal from "../../common/ConfirmModal.jsx";

const STATUS_STYLES = {
  open: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  paid: "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800",
  cancelled:
    "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800",
};

export default function OrderList({
  orders = [],
  menuItems = [],
  onSetStatus,
  onSelectOrder,
}) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [diningFilter, setDiningFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [orderToCancel, setOrderToCancel] = useState(null);

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, {
      status: statusFilter,
      search,
      dining: diningFilter,
    });
  }, [orders, statusFilter, search, diningFilter]);

  const openCount = useMemo(() => {
    return orders.filter((o) => o.status === "open").length;
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
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === "all"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter("open")}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                statusFilter === "open"
                  ? "bg-amber-600 dark:bg-amber-500 text-white shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {t("orders.open")}
              {openCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 rounded-full font-bold ${
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
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === "paid"
                  ? "bg-green-600 text-white shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {t("orders.paid")}
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === "cancelled"
                  ? "bg-red-600 text-white shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {t("orders.cancelled")}
            </button>
          </div>

          {/* Dining Type Filters */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setDiningFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                diningFilter === "all"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDiningFilter("dine-in")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                diningFilter === "dine-in"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Dine-In
            </button>
            <button
              onClick={() => setDiningFilter("takeaway")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                diningFilter === "takeaway"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Takeaway
            </button>
          </div>
        </div>

        <div className="relative max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or note…"
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
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
          filteredOrders.slice(0, 50).map((order) => {
            const details = parseOrderDetails(order, menuItems);

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder && onSelectOrder(order)}
                className="p-4 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Main Order Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Row 1: Order #, Order Name / Items, Amount, Status tag */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                      #{details.orderId}
                    </span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate max-w-sm">
                      {details.orderName}
                    </span>
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 ml-auto sm:ml-0">
                      {money(details.amountCents)}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        STATUS_STYLES[details.status] ||
                        "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      }`}
                    >
                      {details.status}
                    </span>
                    {details.offline && (
                      <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded font-mono">
                        offline
                      </span>
                    )}
                  </div>

                  {/* Row 2: Date/Time, Customer, Cashier, Barista, Dining */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    {/* Date / Time */}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-medium text-stone-600 dark:text-stone-300">
                        {details.formattedTime}
                      </span>
                    </span>

                    {/* Customer Name if available */}
                    {details.customerName && (
                      <span className="inline-flex items-center gap-1 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-md font-medium">
                        <User className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                        <span>{details.customerName}</span>
                      </span>
                    )}

                    {/* Cashier */}
                    <span className="inline-flex items-center gap-1">
                      <span className="text-stone-400 dark:text-stone-500 inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Cashier:
                      </span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {details.cashier}
                      </span>
                    </span>

                    {/* Barista */}
                    <span className="inline-flex items-center gap-1">
                      <span className="text-stone-400 dark:text-stone-500 inline-flex items-center gap-1">
                        <Coffee className="w-3 h-3" /> Barista:
                      </span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {details.barista || "Barista Station"}
                      </span>
                    </span>

                    {/* Dining Tag */}
                    {details.diningInfo.type === "dine-in" && (
                      <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
                        <Utensils className="w-3 h-3 text-stone-500" /> {details.diningInfo.label || "Dine-In"}
                      </span>
                    )}
                    {details.diningInfo.type === "takeaway" && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <ShoppingBag className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Takeaway
                      </span>
                    )}
                  </div>

                  {/* Row 3: Instructions note if present */}
                  {details.cleanNote && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                      "{details.cleanNote}"
                    </p>
                  )}
                </div>

                {/* Right side: Quick Action Buttons & Details chevron */}
                <div
                  className="flex items-center gap-2 self-end sm:self-center shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {details.status === "open" && onSetStatus && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSetStatus(order.id, "paid")}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-2xs"
                      >
                        {t("orders.markPaid")}
                      </button>
                      <button
                        onClick={() => setOrderToCancel(order)}
                        className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1.5 rounded-lg transition"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  )}
                  <span className="text-stone-300 dark:text-stone-600 text-xs pl-1">
                    ›
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm Cancel Order Modal */}
      <ConfirmModal
        isOpen={Boolean(orderToCancel)}
        title="Cancel Order"
        message={
          orderToCancel
            ? `Are you sure you want to cancel Order #${orderToCancel.id}? This will mark the order ticket as cancelled.`
            : ""
        }
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        onConfirm={() => {
          if (orderToCancel) {
            onSetStatus(orderToCancel.id, "cancelled");
            setOrderToCancel(null);
          }
        }}
        onClose={() => setOrderToCancel(null)}
      />
    </div>
  );
}

