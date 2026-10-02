import { money } from "../../../utils/money.js";

const STATUS_STYLES = {
  open: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  paid: "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
  cancelled: "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
};

export default function OrderDetailsModal({
  order,
  menuItems = [],
  onClose,
  onSetStatus
}) {
  if (!order) return null;

  // Resolve item names and prices from menu catalog if line only has menuItemId
  const items = (order.items || []).map(line => {
    const menuItem = menuItems.find(m => m.id === line.menuItemId);
    return {
      name: line.name || (menuItem ? menuItem.name : `Item #${line.menuItemId}`),
      priceCents: line.priceCents || (menuItem ? menuItem.priceCents : 0),
      quantity: line.quantity || 1
    };
  });

  function handlePrint() {
    window.print();
  }

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "Just now";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh] text-stone-900 dark:text-stone-100 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Order #{order.id}
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                STATUS_STYLES[order.status] ||
                "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {order.status}
            </span>
            {order.offline && (
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                offline
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Content / Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex justify-between">
            <span>Date: {formattedDate}</span>
            {order.note && (
              <span className="font-medium text-stone-700 dark:text-stone-300">
                Note: {order.note}
              </span>
            )}
          </div>

          <div className="border border-stone-100 dark:border-stone-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Item</th>
                  <th className="text-center py-2 px-2 font-medium">Qty</th>
                  <th className="text-right py-2 px-3 font-medium">Price</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-stone-400 dark:text-stone-600"
                    >
                      No line items recorded.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="py-2.5 px-3 font-medium text-stone-800 dark:text-stone-200">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-2 text-center text-stone-600 dark:text-stone-300">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-500 dark:text-stone-400">
                        {money(item.priceCents)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-stone-900 dark:text-stone-100">
                        {money(item.priceCents * item.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Total Amount
            </span>
            <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {money(order.totalCents)}
            </span>
          </div>
        </div>

        {/* Modal Footer & Actions */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 px-3 py-1.5 rounded-lg transition"
          >
            Print Receipt
          </button>

          <div className="flex items-center gap-2">
            {order.status === "open" && onSetStatus && (
              <>
                <button
                  onClick={() => {
                    onSetStatus(order.id, "cancelled");
                    onClose();
                  }}
                  className="text-xs bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg transition"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => {
                    onSetStatus(order.id, "paid");
                    onClose();
                  }}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1.5 rounded-lg transition"
                >
                  Mark as Paid
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1.5 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
