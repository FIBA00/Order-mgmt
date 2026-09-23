import { money } from "../../utils/money";

export default function MenuList({ items, onOrder }) {
  if (!items.length) {
    return <p className="text-gray-400 text-sm">No menu items yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onOrder(item)}
          className="flex flex-col items-start bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition text-left"
        >
          <span className="font-medium text-gray-900 text-sm">{item.name}</span>
          <span className="text-blue-600 text-sm mt-1">{money(item.priceCents)}</span>
        </button>
      ))}
    </div>
  );
}
