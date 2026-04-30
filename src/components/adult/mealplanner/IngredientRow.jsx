import { Trash2 } from "lucide-react";

const UNITS = ["g","kg","ml","L","tsp","tbsp","cup","oz","lb","piece","bunch","can","box",""];

export default function IngredientRow({ ingredient, onChange, onDelete }) {
  const upd = (p) => onChange({ ...ingredient, ...p });
  return (
    <div className="flex items-center gap-2">
      <input
        value={ingredient.name}
        onChange={(e) => upd({ name: e.target.value })}
        placeholder="Ingredient"
        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-0"
      />
      <input
        type="text"
        value={ingredient.quantity}
        onChange={(e) => upd({ quantity: e.target.value })}
        placeholder="Qty"
        className="w-14 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-shrink-0"
      />
      <select
        value={ingredient.unit}
        onChange={(e) => upd({ unit: e.target.value })}
        className="w-18 border border-gray-200 rounded-lg px-1 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-shrink-0"
        style={{ width: 68 }}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>{u || "unit"}</option>
        ))}
      </select>
      <input
        type="checkbox"
        checked={ingredient.addToGrocery !== false}
        onChange={(e) => upd({ addToGrocery: e.target.checked })}
        className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
        title="Add to grocery list"
      />
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-500 flex-shrink-0 p-1 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
