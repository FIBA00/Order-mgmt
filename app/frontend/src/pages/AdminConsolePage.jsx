import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { api, isDesktop } from "../api/client.js";
import { useTheme } from "../utils/theme.js";
import ConfirmModal from "../features/common/ConfirmModal.jsx";
import UserMenu from "../features/common/UserMenu.jsx";

export default function AdminConsolePage({ user, onLogout }) {
  const { toggleTheme, isDark } = useTheme();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [deletingMember, setDeletingMember] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");

  // Store Profile & Tax State
  const initialStore = useMemo(() => (api.store ? api.store.get() : {}), []);
  const [storeName, setStoreName] = useState(
    initialStore.name || "The Artisan Roast Cafe",
  );
  const [storeAddress, setStoreAddress] = useState(
    initialStore.address || "123 Coffee Lane, Suite 100",
  );
  const [storePhone, setStorePhone] = useState(
    initialStore.phone || "(555) 234-5678",
  );
  const [taxRate, setTaxRate] = useState(
    initialStore.taxRatePercent !== undefined ? initialStore.taxRatePercent : 8.5,
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    initialStore.currency || "$",
  );
  const [receiptHeader, setReceiptHeader] = useState(
    initialStore.receiptHeader || "Welcome to The Artisan Roast Cafe",
  );
  const [receiptFooter, setReceiptFooter] = useState(
    initialStore.receiptFooter || "Thank you for dining with us! Come back soon.",
  );

  function handleSaveStoreProfile(e) {
    e.preventDefault();
    if (!api.store) return;
    const taxNum = parseFloat(taxRate);
    api.store.save({
      name: storeName.trim(),
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      taxRatePercent: isNaN(taxNum) ? 0 : Math.max(0, taxNum),
      currency: currencySymbol.trim() || "$",
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
    });
    setMessage("Store profile & tax settings saved successfully.");
  }

  // Provisioning modal state
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const members = await api.staff.list();
      setStaffList(Array.isArray(members) ? members : []);
    } catch (err) {
      setMessage(`Failed to load staff accounts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function handleProvisionStaff(e) {
    e.preventDefault();
    setModalError("");

    if (!username.trim()) {
      setModalError("Username is required");
      return;
    }
    if (password.length < 6) {
      setModalError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.staff.create({
        username: username.trim(),
        password,
        role,
      });
      setUsername("");
      setPassword("");
      setRole("cashier");
      setShowModal(false);
      await loadStaff();
      setMessage(`Provisioned account for "${username.trim()}".`);
    } catch (err) {
      setModalError(err.message || "Failed to create staff account");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteStaff(member) {
    if (member.id === user.id || member.username === user.username) {
      setMessage("Cannot delete your own active administrator account.");
      return;
    }
    setDeletingMember(member);
  }

  async function confirmDeleteMember() {
    if (!deletingMember) return;
    try {
      await api.staff.delete(deletingMember.id);
      await loadStaff();
      setMessage(`Staff account "${deletingMember.username}" removed.`);
    } catch (err) {
      setMessage(`Delete failed: ${err.message}`);
    }
  }

  // Filter staff by search query
  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.toLowerCase();
    return staffList.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.role && m.role.toLowerCase().includes(q)),
    );
  }, [staffList, search]);

  const adminCount = staffList.filter((m) => m.role === "admin").length;
  const cashierCount = staffList.filter((m) => m.role === "cashier").length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
              ☕
            </span>
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Order Manager
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              📋 POS Register
            </Link>
            <Link
              to="/menu"
              className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              ☕ Menu Catalog
            </Link>
            <Link
              to="/finances"
              className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              💰 Finance
            </Link>
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs transition"
            >
              👥 Staff & Admin
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm transition"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Consolidated User Menu Circular Button */}
          <UserMenu user={user} onLogout={onLogout} />
        </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {message && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="hover:opacity-75 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Admin Section Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === "staff"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            👥 Staff Accounts ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === "store"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            🏪 Store Profile & Tax
          </button>
        </div>

        {activeTab === "staff" ? (
          <>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Staff & Account Provisioning
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Manage authorized cashiers and system administrators for this register.
                </p>
              </div>

              <button
                onClick={() => {
                  setModalError("");
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <span>+</span> Provision Staff Account
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xs">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Total Accounts
                </span>
                <p className="text-2xl font-bold mt-1 text-stone-900 dark:text-stone-100">
                  {staffList.length}
                </p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xs">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Administrators
                </span>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {adminCount}
                </p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xs">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Cashiers
                </span>
                <p className="text-2xl font-bold mt-1 text-stone-700 dark:text-stone-300">
                  {cashierCount}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search accounts by username or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-stone-400 hover:text-stone-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Staff Table */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-2xs">
              {loading ? (
                <div className="p-12 text-center text-xs text-stone-400">
                  Loading accounts…
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400">
                  No staff accounts found.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Account ID</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredStaff.map((member) => {
                      const isCurrent =
                        member.id === user.id || member.username === user.username;
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition"
                        >
                          <td className="py-3 px-4 font-medium text-stone-900 dark:text-stone-100">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] text-stone-600 dark:text-stone-300 font-bold">
                                {member.username.slice(0, 2).toUpperCase()}
                              </span>
                              <span>{member.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                member.role === "admin"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                              }`}
                            >
                              {member.role || "cashier"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-400 font-mono">
                            #{member.id}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStaff(member)}
                              disabled={isCurrent}
                              title={
                                isCurrent
                                  ? "Cannot delete your own account"
                                  : "Deactivate account"
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                                isCurrent
                                  ? "text-stone-300 dark:text-stone-600 cursor-not-allowed"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              }`}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Store Profile & Tax Settings Form */
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-2xs max-w-2xl">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              Store Profile & Tax Configuration
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Configure store branding, sales tax, and receipt greetings applied across all tickets.
            </p>

            <form onSubmit={handleSaveStoreProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Store / Cafe Name
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Sales Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Receipt Header Note
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="Welcome message printed on receipts"
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you message"
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-xs transition"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Provision Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-xl transition-colors">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              Provision Staff Account
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Enter credentials to grant register access.
            </p>

            <form onSubmit={handleProvisionStaff} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. barista_sam"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                >
                  <option value="cashier">Cashier (POS Operations)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  required
                />
              </div>

              {modalError && (
                <p className="text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2.5 rounded-xl">
                  {modalError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Staff Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingMember)}
        title="Deactivate Staff Account"
        message={`Are you sure you want to remove staff account "${deletingMember?.username}"? They will lose register access.`}
        confirmLabel="Remove Account"
        variant="danger"
        onConfirm={confirmDeleteMember}
        onClose={() => setDeletingMember(null)}
      />
    </div>
  );
}
