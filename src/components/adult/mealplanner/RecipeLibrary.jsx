import { useState } from "react";
import { X, ExternalLink, Trash2, BookOpen } from "lucide-react";
import { TAG_COLORS } from "./RecipePanel.jsx";

const uid = () => Math.random().toString(36).slice(2, 9);

const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function RecipeLibrary({ mealPlanner, setMealPlanner, onClose }) {
  const [search,         setSearch]         = useState("");
  const [filterColor,    setFilterColor]    = useState(null);
  const [assignRecipe,   setAssignRecipe]   = useState(null);
  const [assignDate,     setAssignDate]     = useState(toStr(new Date()));
  const [assignMealType, setAssignMealType] = useState(mealPlanner.mealTypes[0] || "Dinner");
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [assigned,       setAssigned]       = useState("");

  // Build library: combine recipeLibrary + deduplicated meals, keyed by name
  const allRecipes = (() => {
    const map = new Map();
    [...(mealPlanner.recipeLibrary || []), ...mealPlanner.meals].forEach((r) => {
      if (r.recipeName && !map.has(r.recipeName.toLowerCase()))
        map.set(r.recipeName.toLowerCase(), r);
    });
    return Array.from(map.values());
  })();

  const filtered = allRecipes.filter((r) => {
    const matchSearch = !search || r.recipeName.toLowerCase().includes(search.toLowerCase());
    const matchColor  = !filterColor || r.colorTag === filterColor;
    return matchSearch && matchColor;
  });

  const deleteRecipe = (name) => {
    setMealPlanner((p) => ({
      ...p,
      meals:         p.meals.filter((m) => m.recipeName !== name),
      recipeLibrary: p.recipeLibrary.filter((r) => r.recipeName !== name),
    }));
    setDeleteConfirm(null);
  };

  const assignToCell = () => {
    if (!assignRecipe) return;
    const { id: _id, date: _d, mealType: _mt, ...rest } = assignRecipe;
    const newMeal = { ...rest, id: uid(), date: assignDate, mealType: assignMealType };
    setMealPlanner((p) => ({
      ...p,
      meals: [...p.meals.filter((m) => !(m.date === assignDate && m.mealType === assignMealType)), newMeal],
    }));
    setAssigned(`"${assignRecipe.recipeName}" assigned!`);
    setAssignRecipe(null);
    setTimeout(() => setAssigned(""), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-500" /> My Recipes
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>

        {/* Search + color filters */}
        <div className="px-5 py-3 border-b border-gray-50 space-y-2 flex-shrink-0">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-1.5 flex-wrap items-center">
            <button onClick={() => setFilterColor(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${!filterColor ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              All
            </button>
            {TAG_COLORS.map((c) => (
              <button key={c} onClick={() => setFilterColor(filterColor === c ? null : c)}
                style={{ background: c, outline: filterColor === c ? "2px solid #1E1B4B" : "none", outlineOffset: 2 }}
                className="w-5 h-5 rounded-full flex-shrink-0 transition-all" />
            ))}
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {assigned && <p className="text-green-600 text-xs font-semibold text-center py-1">{assigned} ✓</p>}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {allRecipes.length === 0
                ? "No recipes yet — add meals to the calendar to build your library!"
                : "No recipes match your search"}
            </div>
          )}
          {filtered.map((r) => (
            <div key={r.recipeName} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <div style={{ background: r.colorTag || "#6366F1" }} className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{r.recipeName}</p>
                <p className="text-xs text-gray-400">
                  {r.ingredients?.length || 0} ingredient{r.ingredients?.length !== 1 ? "s" : ""} · {r.servings || 4} servings
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.recipeUrl && (
                  <a href={r.recipeUrl} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-600 p-1 transition-colors" title="View recipe">
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => setAssignRecipe(assignRecipe?.recipeName === r.recipeName ? null : r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${assignRecipe?.recipeName === r.recipeName ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                  Assign
                </button>
                <button onClick={() => setDeleteConfirm(r.recipeName)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Assign panel */}
        {assignRecipe && (
          <div className="px-5 py-3 border-t border-indigo-100 bg-indigo-50 flex-shrink-0">
            <p className="text-xs font-bold text-indigo-700 mb-2">Assign "{assignRecipe.recipeName}" to:</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Date</label>
                <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Meal</label>
                <select value={assignMealType} onChange={(e) => setAssignMealType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {mealPlanner.mealTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAssignRecipe(null)} className="flex-1 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-white transition-colors">Cancel</button>
              <button onClick={assignToCell} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors">Assign to Calendar</button>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="px-5 py-3 border-t border-red-100 bg-red-50 flex-shrink-0">
            <p className="text-xs text-red-700 font-medium mb-2">Delete "{deleteConfirm}"? It will be removed from all meal cells.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-1.5 border border-gray-200 rounded-xl text-xs hover:bg-white transition-colors">Cancel</button>
              <button onClick={() => deleteRecipe(deleteConfirm)} className="flex-1 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors">Delete Recipe</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
