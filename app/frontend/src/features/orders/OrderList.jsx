import { money } from "../../utils/money";

const STATUS_STYLES = {
  open:      "bg-yellow-100 text-yellow-800",
  paid:      "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function OrderList({ orders, onSetStatus }) {
  if (!orders.length) {
    return <p className="text-gray-400 text-sm">No orders yet.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {orders.slice(0, 20).map(order => (
        <li key={order.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500">#{order.id}</span>
            <span className="text-sm text-gray-900">{money(order.totalCents)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status]}`}>
              {order.status}
            </span>
          </div>
          {order.status === "open" && onSetStatus && (
            <div className="flex gap-2">
              <button
                onClick={() => onSetStatus(order.id, "paid")}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Mark paid
              </button>
              <button
                onClick={() => onSetStatus(order.id, "cancelled")}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
