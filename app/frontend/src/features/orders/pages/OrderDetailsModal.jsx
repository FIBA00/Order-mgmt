import { useState, useEffect } from "react";
import { X, User, Tag, Coffee, ShoppingBag, Utensils, Printer, Download } from "lucide-react";
import { money } from "../../../utils/money.js";
import { parseOrderDetails } from "../../../utils/order.js";
import { printReceiptPdf, downloadReceiptPdf } from "../../../utils/pdf.js";
import { api } from "../../../api/client.js";
import ConfirmModal from "../../common/ConfirmModal.jsx";

const STATUS_STYLES = {
  open: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  paid: "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
  cancelled:
    "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
};

export default function OrderDetailsModal({
  order,
  menuItems = [],
  onClose,
  onSetStatus,
}) {
  const [orderData, setOrderData] = useState(order);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    setOrderData(order);
    if (order?.id && (!order.items || !order.items.length) && api?.orders?.get) {
      setLoadingItems(true);
      api.orders
        .get(order.id)
        .then((fetched) => {
          if (fetched) {
            setOrderData((prev) => ({ ...prev, ...fetched }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingItems(false));
    }
  }, [order?.id]);

  if (!orderData) return null;

  // Store profile for receipt branding and tax
  const store = api?.store ? api.store.get() : {};
  const taxRate =
    store?.taxRatePercent !== undefined ? store.taxRatePercent : 8.5;

  // Resolve item names and prices from menu catalog if line only has menuItemId
  const items = (orderData.items || []).map((line) => {
    const menuItem = menuItems.find((m) => m.id === line.menuItemId);
    return {
      name:
        line.name || (menuItem ? menuItem.name : `Item #${line.menuItemId}`),
      priceCents:
        line.unitPriceCents || line.priceCents || (menuItem ? menuItem.priceCents : 0),
      quantity: line.quantity || 1,
    };
  });

  const subtotalCents =
    items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) ||
    orderData.totalCents ||
    0;
  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const grandTotalCents = subtotalCents + taxCents;

  const details = parseOrderDetails(orderData, menuItems);

  function handlePrint() {
    printReceiptPdf(orderData, menuItems, store);
  }

  function handleDownload() {
    downloadReceiptPdf(orderData, menuItems, store);
  }

  const formattedDate = orderData.createdAt
    ? new Date(orderData.createdAt).toLocaleString()
    : "Just now";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh] text-stone-900 dark:text-stone-100 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Order #{orderData.id}
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                STATUS_STYLES[orderData.status] ||
                "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {orderData.status}
            </span>
            {orderData.offline && (
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                offline
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Store Branding Header */}
          <div className="text-center pb-3 border-b border-dashed border-stone-200 dark:border-stone-800 space-y-0.5">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm tracking-tight">
              {store.name || "The Artisan Roast Cafe"}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {store.address || "123 Coffee Lane, Suite 100"} · {store.phone || "(555) 234-5678"}
            </p>
            {store.receiptHeader && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic pt-0.5">
                "{store.receiptHeader}"
              </p>
            )}
          </div>

          {/* Vertical Tabular Order Details Matching Across from Each Other */}
          <div className="bg-stone-50/80 dark:bg-stone-800/40 rounded-xl p-3 border border-stone-100 dark:border-stone-800 divide-y divide-stone-200/60 dark:divide-stone-700/60 text-xs">
            <div className="pb-2 flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Status</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  STATUS_STYLES[orderData.status] || "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                }`}
              >
                {orderData.status}
              </span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Date & Time</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {formattedDate}
              </span>
            </div>
            {details.customerName && (
              <div className="py-2 flex justify-between items-center">
                <span className="text-stone-500 dark:text-stone-400">Customer</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center">
                  <User className="w-3.5 h-3.5 inline mr-1 text-amber-600 dark:text-amber-400" />
                  {details.customerName}
                </span>
              </div>
            )}
            <div className="py-2 flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Cashier</span>
              <span className="font-medium text-stone-800 dark:text-stone-200 flex items-center">
                <Tag className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
                {details.cashier}
              </span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Barista</span>
              <span className="font-medium text-stone-800 dark:text-stone-200 flex items-center">
                <Coffee className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
                {details.barista || "Barista Station"}
              </span>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Dining Mode</span>
              <span className="font-medium text-stone-800 dark:text-stone-200 flex items-center">
                {details.diningInfo.type === "takeaway" ? (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 inline mr-1" /> Takeaway
                  </>
                ) : (
                  <>
                    <Utensils className="w-3.5 h-3.5 inline mr-1" />
                    {details.diningInfo.label || "Dine-In"}
                  </>
                )}
              </span>
            </div>
          </div>

          {details.cleanNote && (
            <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="font-semibold text-stone-500 dark:text-stone-400">Note:</span>{" "}
              {details.cleanNote}
            </p>
          )}

          {/* Vertical Tabular Order Items Matching Across from Each Other */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs font-semibold text-stone-700 dark:text-stone-300 pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span>Items</span>
              <span>Subtotal</span>
            </div>

            {loadingItems ? (
              <p className="text-xs text-stone-400 py-3 text-center">Loading items…</p>
            ) : items.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs">
                {items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="truncate">
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500">
                          {money(item.priceCents)} each
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 shrink-0">
                      {money(item.priceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
                <span className="text-stone-500 dark:text-stone-400">
                  {details.orderName || `Order #${orderData.id}`}
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {money(orderData.totalCents)}
                </span>
              </div>
            )}
          </div>

          {/* Vertical Tabular Pricing Breakdown Matching Across from Each Other */}
          <div className="space-y-1.5 text-xs pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Subtotal</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">{money(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Sales Tax ({taxRate}%)</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">{money(taxCents)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-stone-200 dark:border-stone-700/60">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                Total
              </span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {money(grandTotalCents)}
              </span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          {store.receiptFooter && (
            <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 italic pt-1">
              "{store.receiptFooter}"
            </p>
          )}
        </div>

        {/* Modal Footer & Actions */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="Print formatted 80mm thermal receipt"
              className="text-xs flex items-center gap-1.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 px-3 py-1.5 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={handleDownload}
              title="Download 80mm receipt PDF"
              className="text-xs flex items-center gap-1 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 px-2.5 py-1.5 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>

          <div className="flex items-center gap-2">
            {orderData.status === "open" && onSetStatus && (
              <>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg transition"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => {
                    onSetStatus(orderData.id, "paid");
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

      {/* Confirm Cancel Order Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Order"
        message={`Are you sure you want to cancel Order #${orderData.id}? This will mark the ticket as cancelled.`}
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        onConfirm={() => {
          onSetStatus(orderData.id, "cancelled");
          onClose();
        }}
        onClose={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
