import { useState } from "react";
import { money } from "../../../utils/money.js";

export default function CurrentTicket({
  items = [],
  onUpdateQuantity,
  onRemove,
  onClear,
  onSubmit,
  submitting = false,
}) {
  const [note, setNote] = useState("");

  const subtotalCents = items.reduce(
    (sum, line) => sum + (line.priceCents || 0) * (line.quantity || 1),
    0,
  );

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!items.length || submitting) return;
    await onSubmit(note);
    setNote("");
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col h-full transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
          Current Ticket
        </h2>
        {items.length > 0 && (
          <button
            onClick={onClear}
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
          items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 dark:border-stone-800/50"
            >
              <div className="flex-1 pr-2">
                <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {money(item.priceCents)} each
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
                  {money(item.priceCents * item.quantity)}
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
          ))
        )}
      </div>

      {/* Ticket Footer & Actions */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Table # / Customer Note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Table 4 or Takeaway"
            className="w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-stone-500 dark:text-stone-400 font-medium">
            Total
          </span>
          <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {money(subtotalCents)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={!items.length || submitting}
          className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-xs"
        >
          {submitting ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
