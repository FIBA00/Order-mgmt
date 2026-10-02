import { useState, useMemo } from "react";
import { money } from "../../../utils/money.js";
import EditMenuItemModal from "./EditMenuItemModal.jsx";

export default function MenuList({
  items = [],
  onSelectItem,
  isAdmin = false,
  onCreateItem,
  onEditItem,
  onDeleteItem,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [category, setCategory] = useState("Food");
  const [submitting, setSubmitting] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["all", ...Array.from(set)];
  }, [items]);

  // Filter items by category and search term
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
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedCategory, search]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !priceStr) return;

    const priceNum = parseFloat(priceStr);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setSubmitting(true);
    try {
      await onCreateItem({
        name: name.trim(),
        priceCents: Math.round(priceNum * 100),
        category: category.trim() || "Food",
      });
      setName("");
      setPriceStr("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items…"
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition"
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

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium px-3 py-2 rounded-xl transition"
            >
              {showForm ? "Cancel" : "+ Add Item"}
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                selectedCategory === cat
                  ? "bg-amber-600 dark:bg-amber-500 text-white shadow-2xs"
                  : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Admin Add Item Form */}
      {isAdmin && showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-wrap gap-3 items-end shadow-xs"
        >
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Iced Latte"
              className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="4.50"
              className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Food, Drinks"
              className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-xl text-xs transition"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {/* Menu Catalog Grid */}
      {!items.length ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 dark:text-stone-600 text-sm">
          No menu items available yet. Add an item using the button above or
          wait for backend sync.
        </div>
      ) : !filteredItems.length ? (
        <p className="text-stone-400 dark:text-stone-600 text-sm py-4">
          No menu items match your search.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              role="button"
              tabIndex={0}
              className="group relative flex flex-col items-start bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition cursor-pointer text-left"
            >
              <div className="w-full flex justify-between items-start">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-tight">
                  {item.name}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {onEditItem && (
                      <button
                        type="button"
                        title="Edit item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                        className="text-stone-400 hover:text-amber-500 dark:hover:text-amber-400 text-xs px-1 rounded transition"
                      >
                        ✎
                      </button>
                    )}
                    {onDeleteItem && (
                      <button
                        type="button"
                        title="Delete item"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 text-xs px-1 rounded transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="text-amber-600 dark:text-amber-400 text-sm mt-1.5 font-bold">
                {money(item.priceCents)}
              </span>
              {item.category && (
                <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 uppercase tracking-wider font-medium">
                  {item.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <EditMenuItemModal
          item={editingItem}
          onSave={onEditItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
