import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Coffee,
  ClipboardList,
  CircleDollarSign,
  Users,
  Sun,
  Moon,
  Lock,
  Printer,
  Download,
  RefreshCw,
  X,
  Utensils,
  ShoppingBag,
  Tag,
  Clock,
  User,
} from "lucide-react";
import { api, isDesktop } from "../api/client.js";
import { money } from "../utils/money.js";
import { parseOrderDetails, parseDiningInfo } from "../utils/order.js";
import {
  printFinancialReportPdf,
  downloadFinancialReportPdf,
} from "../utils/pdf.js";
import { useTheme } from "../utils/theme.js";
import UserMenu from "../features/common/UserMenu.jsx";
import LanguageSwitcher from "../features/common/LanguageSwitcher.jsx";
import OrderDetailsModal from "../features/orders/pages/OrderDetailsModal.jsx";

export default function FinancesPage({ user, onLogout }) {
  const { t } = useTranslation();
  const { toggleTheme, isDark } = useTheme();

  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today"); // 'today' | 'all'
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderList, menuItems] = await Promise.all([
        api.orders.list(),
        api.menu.list(),
      ]);
      setOrders(orderList || []);
      setMenu(menuItems || []);
    } catch (err) {
      setMessage(`Failed to load financial records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter orders by time period
  const periodOrders = useMemo(() => {
    if (period === "all") return orders;
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders.filter(
      (o) => !o.createdAt || o.createdAt.startsWith(todayStr),
    );
  }, [orders, period]);

  // Aggregate high-level financial metrics
  const metrics = useMemo(() => {
    const paid = periodOrders.filter((o) => o.status === "paid");
    const cancelled = periodOrders.filter((o) => o.status === "cancelled");
    const open = periodOrders.filter((o) => o.status === "open");

    const grossRevenueCents = paid.reduce(
      (sum, o) => sum + (o.totalCents || 0),
      0,
    );
    const lostRevenueCents = cancelled.reduce(
      (sum, o) => sum + (o.totalCents || 0),
      0,
    );
    const pendingRevenueCents = open.reduce(
      (sum, o) => sum + (o.totalCents || 0),
      0,
    );
    const avgTicketCents = paid.length
      ? Math.round(grossRevenueCents / paid.length)
      : 0;

    // Breakdown by Dining Channel
    let dineInRevenue = 0;
    let dineInCount = 0;
    let takeawayRevenue = 0;
    let takeawayCount = 0;

    for (const o of paid) {
      const dining = parseDiningInfo(o.note);
      if (dining.type === "takeaway") {
        takeawayRevenue += o.totalCents || 0;
        takeawayCount++;
      } else {
        dineInRevenue += o.totalCents || 0;
        dineInCount++;
      }
    }

    // Breakdown by Staff Cashier
    const staffMap = {};
    for (const o of paid) {
      const staff = o.username || o.cashier || "Staff";
      if (!staffMap[staff]) {
        staffMap[staff] = { count: 0, revenueCents: 0 };
      }
      staffMap[staff].count++;
      staffMap[staff].revenueCents += o.totalCents || 0;
    }

    return {
      totalCount: periodOrders.length,
      paidCount: paid.length,
      cancelledCount: cancelled.length,
      openCount: open.length,
      grossRevenueCents,
      lostRevenueCents,
      pendingRevenueCents,
      avgTicketCents,
      dineInRevenue,
      dineInCount,
      takeawayRevenue,
      takeawayCount,
      staffPerformance: Object.entries(staffMap).map(([name, data]) => ({
        name,
        ...data,
      })),
    };
  }, [periodOrders]);

  // Ledger filtered transactions
  const ledgerOrders = useMemo(() => {
    return periodOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = String(o.id).toLowerCase().includes(q);
        const userMatch = (o.username || "").toLowerCase().includes(q);
        const noteMatch = (o.note || "").toLowerCase().includes(q);
        if (!idMatch && !userMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [periodOrders, statusFilter, search]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <Lock className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Access Restricted
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Store financial analytics and revenue ledgers require administrator
            privileges.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            ← Return to POS Register
          </Link>
        </div>
      </div>
    );
  }

  function handlePrintReport() {
    const store = api?.store ? api.store.get() : {};
    printFinancialReportPdf({
      orders: periodOrders,
      menu,
      period,
      store,
      user,
    });
  }

  function handleDownloadReport() {
    const store = api?.store ? api.store.get() : {};
    downloadFinancialReportPdf({
      orders: periodOrders,
      menu,
      period,
      store,
      user,
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      {/* Top Application Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
              <Coffee className="w-4 h-4" />
            </span>
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {t("dashboard.title")}
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              <ClipboardList className="w-3.5 h-3.5" /> {t("nav.pos")}
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              <Coffee className="w-3.5 h-3.5" /> {t("nav.menu")}
            </Link>
            <Link
              to="/finances"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs transition font-semibold"
            >
              <CircleDollarSign className="w-3.5 h-3.5" /> {t("nav.finance")}
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              <Users className="w-3.5 h-3.5" /> {t("nav.admin")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            title="Print formatted PDF report"
            className="inline-flex items-center gap-1.5 text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 px-3 py-1.5 rounded-xl font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </button>
          <button
            onClick={handleDownloadReport}
            title="Download vector PDF report"
            className="inline-flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-medium transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> {t("finance.exportPdf")}
          </button>
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm transition"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 flex-1">
        {/* Banner with Title and Period Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {t("finance.title")}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Financial reporting, channel breakdowns, and historical order ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium flex items-center gap-1">
              <button
                onClick={() => setPeriod("today")}
                className={`px-3 py-1 rounded-lg transition ${
                  period === "today"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`px-3 py-1 rounded-lg transition ${
                  period === "all"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                All Time
              </button>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {message && (
          <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
            <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Gross Revenue ({period === "today" ? "Today" : "All Time"})
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">
              {money(metrics.grossRevenueCents)}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              From {metrics.paidCount} paid transaction(s)
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
            <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Average Ticket Value
            </p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {money(metrics.avgTicketCents)}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Per completed transaction
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
            <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Open / Pending Revenue
            </p>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-200 mt-1">
              {money(metrics.pendingRevenueCents)}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              {metrics.openCount} open ticket(s) awaiting payment
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
            <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
              Cancelled / Lost Revenue
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {money(metrics.lostRevenueCents)}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              {metrics.cancelledCount} cancelled ticket(s)
            </p>
          </div>
        </div>

        {/* Revenue Channel & Staff Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dining Mode Split */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Dining Channel Revenue
            </h3>
            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                  <Utensils className="w-4 h-4 text-stone-400" /> Dine-In ({metrics.dineInCount} orders)
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {money(metrics.dineInRevenue)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                  <ShoppingBag className="w-4 h-4 text-stone-400" /> Takeaway ({metrics.takeawayCount} orders)
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {money(metrics.takeawayRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Cashier / Staff Sales Performance */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Staff Sales Performance
            </h3>
            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {!metrics.staffPerformance.length ? (
                <p className="text-stone-400 py-3 text-center">No sales recorded yet.</p>
              ) : (
                metrics.staffPerformance.map((staff, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <Tag className="w-4 h-4 text-stone-400" /> {staff.name} ({staff.count} orders)
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {money(staff.revenueCents)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Financial Ledger Section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Financial Transaction Ledger ({ledgerOrders.length})
              </h3>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Audit historical transactions and examine itemized payment records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                      : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("paid")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "paid"
                      ? "bg-green-600 text-white shadow-2xs font-semibold"
                      : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setStatusFilter("open")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "open"
                      ? "bg-amber-600 text-white shadow-2xs font-semibold"
                      : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === "cancelled"
                      ? "bg-red-600 text-white shadow-2xs font-semibold"
                      : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ledger…"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs">
            {!ledgerOrders.length ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                No transactions match the selected period and filter.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
                {ledgerOrders.map((order) => {
                  const details = parseOrderDetails(order, menu);
                  const isPaid = order.status === "paid";
                  const isCancelled = order.status === "cancelled";

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="p-3.5 sm:px-5 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-[11px]">
                            #{order.id}
                          </span>
                          <span className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-sm">
                            {details.orderName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                              isPaid
                                ? "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : isCancelled
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" /> {details.formattedTime}
                          </span>
                          {details.customerName && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" /> {details.customerName}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Tag className="w-3 h-3 text-stone-400" /> {details.cashier}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {details.diningInfo.type === "takeaway" ? (
                              <>
                                <ShoppingBag className="w-3 h-3 text-stone-400" /> Takeaway
                              </>
                            ) : (
                              <>
                                <Utensils className="w-3 h-3 text-stone-400" /> {details.diningInfo.label || "Dine-In"}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span
                          className={`text-sm font-extrabold ${
                            isPaid
                              ? "text-stone-900 dark:text-stone-100"
                              : isCancelled
                                ? "text-stone-400 line-through"
                                : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {money(order.totalCents)}
                        </span>
                        <span className="text-stone-400 dark:text-stone-600 text-xs">
                          ›
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Itemized Order Receipt Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          menuItems={menu}
          onClose={() => setSelectedOrder(null)}
          onSetStatus={() => {}}
        />
      )}
    </div>
  );
}
