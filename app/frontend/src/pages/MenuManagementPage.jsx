import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { api, isDesktop } from "../api/client.js";
import { money } from "../utils/money.js";
import { useTheme } from "../utils/theme.js";
import EditMenuItemModal from "../features/menu/pages/EditMenuItemModal.jsx";

export default function MenuManagementPage({ user, onLogout }) {
  const { toggleTheme, isDark } = useTheme();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingItem, setEditingItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Food");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.menu.list();
      setItems(list);
    } catch (err) {
      setMessage(`Failed to load menu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return set.size ? ["all", ...Array.from(set)] : ["all"];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        selectedCategory !== "all" &&
        (item.category || "Food").toLowerCase() !==
          selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !(item.category || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, search]);

  // Create menu item
  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setCreateError("Please enter a valid price greater than $0");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      await api.menu.create({
        name: newName.trim(),
        priceCents: Math.round(priceNum * 100),
        category: newCategory.trim() || "Food",
      });
      setNewName("");
      setNewPrice("");
      setShowCreateModal(false);
      await loadMenu();
      setMessage(`Added menu item "${newName.trim()}".`);
    } catch (err) {
      setCreateError(err.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  }

  // Edit menu item
  async function handleSaveEdit(id, data) {
    try {
      await api.menu.update(id, data);
      await loadMenu();
      setMessage(`Updated menu item "${data.name}".`);
    } catch (err) {
      setMessage(`Update error: ${err.message}`);
    }
  }

  // Delete menu item
  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.menu.delete(id);
      await loadMenu();
      setMessage(`Deleted "${name}".`);
    } catch (err) {
      setMessage(`Delete error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      {/* Top Application Header */}
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
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs transition"
            >
              ☕ Menu Catalog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm transition"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <span className="text-xs text-stone-500 dark:text-stone-400">
            {user?.username}
            <span className="ml-1.5 text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full uppercase font-medium">
              {user?.role}
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

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 flex-1">
        {/* Page Title & Add Item Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Menu Management
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Create, edit, price, and organize menu items across categories.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-xs"
          >
            <span>+</span> Add Menu Item
          </button>
        </div>

        {/* Status notification toast */}
        {message && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="text-amber-500 hover:text-amber-700 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by name or category…"
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                ✕
              </button>
            )}
          </div>

          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                    selectedCategory === cat
                      ? "bg-amber-600 dark:bg-amber-500 text-white shadow-2xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Table / Listing */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400 dark:text-stone-500">
              Loading menu catalog…
            </div>
          ) : !items.length ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xl mx-auto flex items-center justify-center mb-3">
                🍽️
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                No menu items yet
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 max-w-sm mx-auto">
                Get started by adding your first food, drink, or dessert item to
                the menu catalog.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-xs transition"
              >
                + Add First Item
              </button>
            </div>
          ) : !filteredItems.length ? (
            <div className="p-12 text-center text-xs text-stone-400 dark:text-stone-500">
              No menu items match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-500 dark:text-stone-400">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Item Name</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition"
                    >
                      <td className="py-3.5 px-4 font-mono text-stone-400">
                        #{item.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md font-medium text-[11px] capitalize">
                          {item.category || "Food"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {money(item.priceCents)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full font-medium border border-green-200 dark:border-green-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg font-medium transition"
                          >
                            ✎ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-lg font-medium transition"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditMenuItemModal
          item={editingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Create New Item Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-800 p-6 text-stone-900 dark:text-stone-100 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Add New Menu Item
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Iced Vanilla Latte"
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="4.75"
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Drinks, Food, Desserts"
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2 rounded-xl">
                  {createError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium py-2 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2 rounded-xl text-xs transition shadow-xs"
                >
                  {creating ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
