import { useState } from "react";
import { Plus, X, Check } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

const CATEGORY_ORDER  = ["produce", "dairy", "meat", "pantry", "other"];
const CATEGORY_LABELS = {
  produce: "🥦 Produce",
  dairy:   "🥛 Dairy",
  meat:    "🍗 Meat & Fish",
  pantry:  "🥫 Pantry & Dry Goods",
  other:   "📦 Other",
};

const categorize = (name) => {
  const n = name.toLowerCase();
  if (/apple|banana|orange|tomato|lettuce|spinach|onion|garlic|potato|carrot|broccoli|cucumber|pepper|mushroom|celery|avocado|lemon|lime|berry|peach|pear|kale|cabbage|corn|pea|ginger/.test(n)) return "produce";
  if (/milk|cheese|butter|cream|yogur|egg|parmesan|mozzarella|cheddar|ricotta|brie/.test(n)) return "dairy";
  if (/chicken|beef|pork|lamb|turkey|salmon|tuna|shrimp|prawn|fish|bacon|sausage|steak|mince|ham|duck/.test(n)) return "meat";
  return "pantry";
};

export default function GroceryList({ mealPlanner, setMealPlanner }) {
  const [newItem,          setNewItem]          = useState("");
  const [clearAllConfirm,  setClearAllConfirm]  = useState(false);

  const items = mealPlanner.groceryList || [];

  const upd = (id, patch) =>
    setMealPlanner((p) => ({ ...p, groceryList: p.groceryList.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  const del = (id) =>
    setMealPlanner((p) => ({ ...p, groceryList: p.groceryList.filter((i) => i.id !== id) }));

  const clearChecked = () =>
    setMealPlanner((p) => ({ ...p, groceryList: p.groceryList.filter((i) => !i.checked) }));
  const clearAll = () => { setMealPlanner((p) => ({ ...p, groceryList: [] })); setClearAllConfirm(false); };

  const addItem = () => {
    const name = newItem.trim();
    if (!name) return;
    setMealPlanner((p) => ({
      ...p,
      groceryList: [...p.groceryList, {
        id: uid(), name, quantity: "", unit: "",
        checked: false, category: categorize(name), sources: [],
      }],
    }));
    setNewItem("");
  };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter((i) => (i.category || "pantry") === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount   = items.length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {totalCount} item{totalCount !== 1 ? "s" : ""}
          {checkedCount > 0 ? ` · ${checkedCount} checked` : ""}
        </p>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button onClick={clearChecked}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
              Clear checked
            </button>
          )}
          <button onClick={() => setClearAllConfirm(true)}
            className="text-xs text-red-500 hover:text-red-700 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition-colors">
            Clear all
          </button>
        </div>
      </div>

      {/* Add item manually */}
      <div className="flex gap-2 mb-6">
        <input
          value={newItem} onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item manually…"
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button onClick={addItem} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0">
          <Plus size={16} />
        </button>
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-medium text-gray-500">Your grocery list is empty</p>
          <p className="text-xs mt-1">Add ingredients when saving recipes to the meal planner</p>
        </div>
      )}

      {/* Grouped items */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {CATEGORY_LABELS[cat] || cat}
          </h4>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {catItems.map((item) => (
              <div key={item.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all ${item.checked ? "opacity-50" : ""}`}>
                <button
                  onClick={() => upd(item.id, { checked: !item.checked })}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.checked ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-indigo-400"}`}>
                  {item.checked && <Check size={11} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {(item.quantity || item.unit) && (
                      <span className="text-xs text-gray-400">{item.quantity} {item.unit}</span>
                    )}
                    {item.sources?.length > 0 && (
                      <span className="text-xs text-indigo-400 italic">from {item.sources.join(", ")}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => del(item.id)} className="text-gray-200 hover:text-red-400 p-1 flex-shrink-0 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Clear all confirmation */}
      {clearAllConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs">
            <p className="font-bold text-gray-800 mb-1">Clear entire list?</p>
            <p className="text-sm text-gray-500 mb-4">This removes all {totalCount} items and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setClearAllConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={clearAll} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
