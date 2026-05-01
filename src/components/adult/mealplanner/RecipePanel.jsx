import { useState } from "react";
import { X, Plus, ExternalLink, ClipboardList } from "lucide-react";
import IngredientRow from "./IngredientRow.jsx";

export const TAG_COLORS = ["#6366F1","#2563EB","#16A34A","#DB2777","#EA580C","#7C3AED","#0891B2","#CA8A04"];

const uid = () => Math.random().toString(36).slice(2, 9);

const isUrl = (s) => { try { new URL(s); return true; } catch { return false; } };

const BLANK_ING = () => ({ id: uid(), name: "", quantity: "", unit: "g", addToGrocery: true, parsed: true });

const categorize = (name) => {
  const n = name.toLowerCase();
  if (/apple|banana|orange|tomato|lettuce|spinach|onion|garlic|potato|carrot|broccoli|cucumber|pepper|mushroom|celery|avocado|lemon|lime|berry|peach|pear|kale|cabbage|corn|pea|ginger/.test(n)) return "produce";
  if (/milk|cheese|butter|cream|yogur|egg|parmesan|mozzarella|cheddar|ricotta|brie/.test(n)) return "dairy";
  if (/chicken|beef|pork|lamb|turkey|salmon|tuna|shrimp|prawn|fish|bacon|sausage|steak|mince|ham|duck/.test(n)) return "meat";
  return "pantry";
};

const parseIngredientLine = (line) => {
  const t = line.trim();
  if (!t) return null;
  // "400g pasta" or "400 g pasta"
  let m = t.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|oz|lb|tsp|tbsp|cups?|pieces?|bunch|cans?|boxes?|litre|liter)\.?\s+(.+)$/i);
  if (m) return { id: uid(), quantity: m[1], unit: m[2].toLowerCase().replace(/s$/, "").replace("litre","L").replace("liter","L").replace("cup","cup"), name: m[3].trim(), addToGrocery: true, parsed: true };
  // "400g" concatenated
  m = t.match(/^(\d+(?:[.,]\d+)?)(g|kg|ml|l|oz|lb|tsp|tbsp|cup)(.+)$/i);
  if (m) return { id: uid(), quantity: m[1], unit: m[2].toLowerCase(), name: m[3].trim(), addToGrocery: true, parsed: true };
  return { id: uid(), quantity: "", unit: "", name: t, addToGrocery: true, parsed: false };
};

export default function RecipePanel({ cell, meal, mealPlanner, setMealPlanner, onClose }) {
  const [recipeName, setRecipeName] = useState(meal?.recipeName || "");
  const [recipeUrl,  setRecipeUrl]  = useState(meal?.recipeUrl  || "");
  const [notes,      setNotes]      = useState(meal?.notes      || "");
  const [servings,   setServings]   = useState(meal?.servings   || 4);
  const [colorTag,   setColorTag]   = useState(meal?.colorTag   || TAG_COLORS[0]);
  const [ingredients, setIngredients] = useState(
    meal?.ingredients?.length ? meal.ingredients : [BLANK_ING()]
  );
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [toast, setToast] = useState("");

  const urlValid = !recipeUrl || isUrl(recipeUrl);
  const canSave  = recipeName.trim() && urlValid;

  const updIng = (id, patch) => setIngredients((p) => p.map((i) => i.id === id ? { ...i, ...patch } : i));
  const delIng = (id)         => setIngredients((p) => p.filter((i) => i.id !== id));
  const addIng = ()           => setIngredients((p) => [...p, BLANK_ING()]);

  const parsePaste = () => {
    const parsed = pasteText.split("\n").map(parseIngredientLine).filter(Boolean);
    setIngredients((p) => [...p.filter((i) => i.name.trim()), ...parsed]);
    setShowPaste(false); setPasteText("");
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const buildMeal = () => ({
    id: meal?.id || uid(),
    date: cell.date, mealType: cell.mealType,
    recipeName: recipeName.trim(), recipeUrl: recipeUrl.trim(),
    notes: notes.trim(), servings, colorTag, ingredients,
  });

  const addToGrocery = () => {
    const toAdd = ingredients.filter((i) => i.addToGrocery !== false && i.name.trim());
    if (!toAdd.length) return 0;
    setMealPlanner((p) => {
      const newItems = toAdd.map((i) => ({
        id: uid(), name: i.name.trim(), quantity: i.quantity, unit: i.unit,
        checked: false, category: categorize(i.name),
        sources: [recipeName.trim() || "Unnamed recipe"],
      }));
      const all = [...(p.groceryList || []), ...newItems];
      const map = new Map();
      all.forEach((item) => {
        const key = `${item.name.toLowerCase().trim()}_${item.unit.toLowerCase()}`;
        if (map.has(key)) {
          const ex = map.get(key);
          const q = (parseFloat(ex.quantity) || 0) + (parseFloat(item.quantity) || 0);
          map.set(key, { ...ex, quantity: q ? String(+q.toFixed(2)) : ex.quantity, sources: [...new Set([...ex.sources, ...item.sources])] });
        } else { map.set(key, { ...item }); }
      });
      return { ...p, groceryList: Array.from(map.values()) };
    });
    return toAdd.length;
  };

  const save = () => {
    if (!canSave) return;
    const mealObj = buildMeal();
    setMealPlanner((p) => ({
      ...p,
      meals: [...p.meals.filter((m) => !(m.date === cell.date && m.mealType === cell.mealType)), mealObj],
    }));
    onClose();
  };

  const saveAndAddGrocery = () => {
    if (!canSave) return;
    addToGrocery();
    save();
  };

  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" });

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:50, display:"flex" }}>
      {/* Backdrop */}
      <div style={{ flex:1, background:"rgba(0,0,0,0.3)" }} onClick={onClose} />
      {/* Panel */}
      <div style={{ width:"100%", maxWidth:448, background:"white", boxShadow:"0 0 40px rgba(0,0,0,0.2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px 16px", paddingTop:"calc(env(safe-area-inset-top) + 16px)", borderBottom:"1px solid #f3f4f6", flexShrink:0 }}>
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{cell.mealType}</p>
            <h2 className="font-bold text-gray-800 text-sm">{fmtDate(cell.date)}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Recipe name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recipe Name *</label>
            <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="e.g. Spaghetti Bolognese" autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recipe URL (optional)</label>
            <div className="flex gap-2">
              <input value={recipeUrl} onChange={(e) => setRecipeUrl(e.target.value)} placeholder="https://..."
                className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${!urlValid ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
              {recipeUrl && urlValid && (
                <a href={recipeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 rounded-xl text-xs font-semibold hover:bg-indigo-100 flex-shrink-0 transition-colors">
                  <ExternalLink size={12} /> View
                </a>
              )}
            </div>
            {!urlValid && <p className="text-red-500 text-xs mt-1">Please enter a valid URL (include https://)</p>}
          </div>

          {/* Servings + color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Servings</label>
              <input type="number" min={1} value={servings} onChange={(e) => setServings(+e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Color Tag</label>
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                {TAG_COLORS.map((c) => (
                  <button key={c} onClick={() => setColorTag(c)}
                    style={{ background:c, outline: colorTag===c ? "2.5px solid #1E1B4B" : "2.5px solid transparent", outlineOffset:2 }}
                    className="w-6 h-6 rounded-full transition-all" />
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="e.g. Double the sauce for leftovers…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingredients</label>
              <div className="flex gap-3">
                <button onClick={() => setShowPaste(!showPaste)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                  <ClipboardList size={12} /> Paste list
                </button>
                <button onClick={addIng} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                  <Plus size={12} /> Add row
                </button>
              </div>
            </div>

            {showPaste && (
              <div className="mb-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <p className="text-xs text-gray-500 mb-2">Paste ingredients — one per line (e.g. "400g pasta", "2 cups flour")</p>
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white" />
                <div className="flex gap-2 mt-2">
                  <button onClick={parsePaste} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Parse & Add</button>
                  <button onClick={() => { setShowPaste(false); setPasteText(""); }} className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.id}>
                  <IngredientRow ingredient={ing} onChange={(patch) => updIng(ing.id, patch)} onDelete={() => delIng(ing.id)} />
                  {ing.parsed === false && (
                    <p className="text-xs text-amber-500 mt-0.5 ml-1">⚠️ Couldn't parse — please check</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">☑ checkbox = include in grocery list</p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2 flex-shrink-0">
          {toast && <p className="text-green-600 text-xs text-center font-semibold">{toast}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => { const n = addToGrocery(); if (n > 0) showToast(`${n} ingredient${n > 1 ? "s" : ""} added to Grocery List ✓`); }}
              className="flex-1 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              + Grocery List
            </button>
          </div>
          <button onClick={save} disabled={!canSave}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all">
            Save Recipe
          </button>
          <button onClick={saveAndAddGrocery} disabled={!canSave}
            className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 disabled:opacity-40 transition-all">
            Save & Add to Grocery List
          </button>
        </div>
      </div>
    </div>
  );
}
