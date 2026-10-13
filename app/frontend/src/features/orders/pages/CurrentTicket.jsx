import { useState } from "react";
import { money } from "../../../utils/money.js";
import { api } from "../../../api/client.js";
import ConfirmModal from "../../common/ConfirmModal.jsx";

const AVAILABLE_MODIFIERS = [
  { id: "oat", label: "Oat Milk", priceCents: 75 },
  { id: "almond", label: "Almond Milk", priceCents: 75 },
  { id: "extra_shot", label: "Extra Shot", priceCents: 50 },
  { id: "decaf", label: "Decaf", priceCents: 0 },
  { id: "no_sugar", label: "No Sugar", priceCents: 0 },
  { id: "extra_hot", label: "Extra Hot", priceCents: 0 },
  { id: "iced", label: "Iced", priceCents: 0 },
];

const TABLE_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `Bar ${i + 1}`),
  "Patio 1",
  "Patio 2",
];

export default function CurrentTicket({
  items = [],
  onUpdateQuantity,
  onRemove,
  onClear,
  onSubmit,
  submitting = false,
}) {
  const [diningMode, setDiningMode] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("Table 1");
  const [customerName, setCustomerName] = useState("");
  const [baristaName, setBaristaName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [modifiersMap, setModifiersMap] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute store tax
  const storeProfile = api?.store ? api.store.get() : { taxRatePercent: 8.5 };
  const taxRate =
    storeProfile?.taxRatePercent !== undefined ? storeProfile.taxRatePercent : 8.5;

  // Compute item line totals with modifiers
  const subtotalCents = items.reduce((sum, line) => {
    const itemMods = modifiersMap[line.menuItemId] || [];
    const modsCost = itemMods.reduce((s, m) => s + (m.priceCents || 0), 0);
    const linePrice = (line.priceCents || 0) + modsCost;
    return sum + linePrice * (line.quantity || 1);
  }, 0);

  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const grandTotalCents = subtotalCents + taxCents;

  function handleToggleModifier(menuItemId, mod) {
    setModifiersMap((prev) => {
      const current = prev[menuItemId] || [];
      const exists = current.some((m) => m.id === mod.id);
      const updated = exists
        ? current.filter((m) => m.id !== mod.id)
        : [...current, mod];
      return { ...prev, [menuItemId]: updated };
    });
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!items.length || submitting) return;

    // Build structured order note with dining tags, customer, barista, and modifiers
    const diningTag =
      diningMode === "dine-in" ? `[${tableNumber} | Dine-In]` : `[Takeaway]`;
    const parts = [diningTag];

    if (customerName.trim()) {
      parts.push(`[Customer: ${customerName.trim()}]`);
    }

    if (baristaName.trim()) {
      parts.push(`[Barista: ${baristaName.trim()}]`);
    }

    if (customerNote.trim()) {
      parts.push(customerNote.trim());
    }

    const modEntries = Object.entries(modifiersMap).filter(
      ([_, list]) => list && list.length > 0,
    );
    if (modEntries.length > 0) {
      const summary = modEntries
        .map(([id, list]) => {
          const itm = items.find((i) => i.menuItemId === Number(id));
          const name = itm ? itm.name : `Item #${id}`;
          return `${name} (+ ${list.map((m) => m.label).join(", ")})`;
        })
        .join("; ");
      parts.push(`| Mods: ${summary}`);
    }

    await onSubmit(parts.join(" "));
    setCustomerName("");
    setBaristaName("");
    setCustomerNote("");
    setModifiersMap({});
    setExpandedItemId(null);
  }

  function handleInternalClear() {
    setModifiersMap({});
    setExpandedItemId(null);
    setCustomerName("");
    setBaristaName("");
    setCustomerNote("");
    onClear();
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col h-full transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
          Current Ticket
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-stone-400 hover:text-red-500 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ticket line items */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[160px] max-h-[300px]">
        {!items.length ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 text-xs py-8">
            <p>No items added yet.</p>
            <p className="mt-1 text-stone-300 dark:text-stone-700">
              Click items on the menu to add to ticket.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const activeMods = modifiersMap[item.menuItemId] || [];
            const modsCost = activeMods.reduce((s, m) => s + (m.priceCents || 0), 0);
            const lineUnitPrice = (item.priceCents || 0) + modsCost;
            const isExpanded = expandedItemId === item.menuItemId;

            return (
              <div
                key={item.menuItemId}
                className="py-1.5 border-b border-stone-50 dark:border-stone-800/50 space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {money(lineUnitPrice)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                        className="px-2 py-0.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/80">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                        className="px-2 py-0.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-16 text-right font-semibold text-stone-900 dark:text-stone-100 text-sm">
                      {money(lineUnitPrice * item.quantity)}
                    </span>

                    <button
                      onClick={() => onRemove(item.menuItemId)}
                      className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 text-xs pl-1 transition"
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Active Modifiers Pills & Customizer Toggle */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {activeMods.map((mod) => (
                    <span
                      key={mod.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      +{mod.label}
                      <button
                        type="button"
                        onClick={() => handleToggleModifier(item.menuItemId, mod)}
                        className="hover:text-red-500 transition text-[9px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedItemId(isExpanded ? null : item.menuItemId)
                    }
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                  >
                    {isExpanded ? "Done" : "+ Options"}
                  </button>
                </div>

                {/* Modifiers Quick Picker Drawer */}
                {isExpanded && (
                  <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/60 mt-1 flex flex-wrap gap-1">
                    {AVAILABLE_MODIFIERS.map((mod) => {
                      const isSelected = activeMods.some((m) => m.id === mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleToggleModifier(item.menuItemId, mod)}
                          className={`text-[10px] px-2 py-0.8 rounded-lg font-medium border transition ${
                            isSelected
                              ? "bg-amber-600 border-amber-600 text-white shadow-2xs"
                              : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                          }`}
                        >
                          {mod.label} {mod.priceCents > 0 && `(+${money(mod.priceCents)})`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Footer & Actions */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
        {/* Dining Mode & Table Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setDiningMode("dine-in")}
              className={`flex-1 py-1 rounded-lg transition text-center ${
                diningMode === "dine-in"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              type="button"
              onClick={() => setDiningMode("takeaway")}
              className={`flex-1 py-1 rounded-lg transition text-center ${
                diningMode === "takeaway"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              🛍️ Takeaway
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {diningMode === "dine-in" ? (
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {TABLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center px-2.5 py-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 font-medium">
                🛍️ Takeaway
              </div>
            )}
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)…"
              className="border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={baristaName}
              onChange={(e) => setBaristaName(e.target.value)}
              placeholder="Barista (optional)…"
              className="border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <input
              type="text"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Special instructions…"
              className="border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-1 text-xs border-t border-stone-100 dark:border-stone-800/80 pt-2">
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Subtotal</span>
            <span>{money(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Tax ({taxRate}%)</span>
            <span>{money(taxCents)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed border-stone-200 dark:border-stone-700/50">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              Total
            </span>
            <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {money(grandTotalCents)}
            </span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={!items.length || submitting}
          className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-xs"
        >
          {submitting ? "Placing Order…" : "Place Order"}
        </button>
      </div>

      {/* Confirm Clear Ticket Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Current Ticket"
        message="Are you sure you want to discard all items currently on this ticket?"
        confirmLabel="Clear Ticket"
        variant="danger"
        onConfirm={handleInternalClear}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

