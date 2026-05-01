import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Check, Link, Loader } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Recipe URL importer ─────────────────────────────────────────────────── */
async function fetchIngredients(url) {
  // Route through a CORS proxy so the browser can read the page HTML
  const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
  const html = await res.text();

  // Most recipe sites embed JSON-LD with @type:"Recipe" — parse that first
  const scriptTags = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of scriptTags) {
    try {
      const data = JSON.parse(raw.trim());
      const recipes = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const node of recipes) {
        if (node["@type"] === "Recipe" || (Array.isArray(node["@type"]) && node["@type"].includes("Recipe"))) {
          const ings = node.recipeIngredient || node.ingredients || [];
          if (ings.length > 0) return { name: node.name || "", ingredients: ings };
        }
      }
    } catch {}
  }
  throw new Error("No recipe data found on this page. Try a different recipe site.");
}

function ImportModal({ onClose, onAdd }) {
  const [url,    setUrl]    = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | preview | error
  const [error,  setError]  = useState("");
  const [recipe, setRecipe] = useState(null);
  const [sel,    setSel]    = useState(new Set());

  // Lock body scroll while modal is open so the page can't shift when keyboard opens
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const load = async () => {
    if (!url.trim()) return;
    setStatus("loading"); setError("");
    try {
      const result = await fetchIngredients(url.trim());
      setRecipe(result);
      setSel(new Set(result.ingredients.map((_, i) => i))); // select all by default
      setStatus("preview");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const toggle = i => setSel(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const confirm = () => {
    const chosen = recipe.ingredients.filter((_, i) => sel.has(i));
    onAdd(chosen, recipe.name);
    onClose();
  };

  return createPortal(
    /* Backdrop — z-[350] sits above nav (100) and More sheet (200) */
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
               display:"flex", alignItems:"flex-end", justifyContent:"center",
               zIndex: 350 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", width:"100%", maxWidth:520,
                    borderRadius:"24px 24px 0 0", boxShadow:"0 -4px 40px rgba(0,0,0,0.18)",
                    display:"flex", flexDirection:"column",
                    maxHeight:"88vh",
                    paddingBottom:"env(safe-area-inset-bottom)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"20px 20px 12px", borderBottom:"1px solid #f1f1f1", flexShrink:0 }}>
          <div>
            <p style={{ fontWeight:700, color:"#1f2937", fontSize:15, margin:0 }}>Import from Recipe URL</p>
            <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>Works with AllRecipes, Food Network, NYT Cooking & more</p>
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:4, display:"flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
          {/* URL input row */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load()}
              placeholder="Paste recipe URL here…"
              style={{ flex:1, border:"1px solid #e5e7eb", borderRadius:12,
                       padding:"10px 12px", fontSize:14, outline:"none" }}
            />
            <button onClick={load} disabled={status === "loading" || !url.trim()}
              style={{ padding:"10px 16px", background:"#4f46e5", color:"#fff", border:"none",
                       borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
                       opacity: (status === "loading" || !url.trim()) ? 0.5 : 1,
                       display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              {status === "loading" ? <Loader size={15} style={{ animation:"spin 1s linear infinite" }} /> : <Link size={15} />}
              {status === "loading" ? "Fetching…" : "Fetch"}
            </button>
          </div>

          {/* Error */}
          {status === "error" && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12,
                          padding:"12px 14px", fontSize:13, color:"#dc2626", marginBottom:16 }}>
              {error}
            </div>
          )}

          {/* Preview */}
          {status === "preview" && recipe && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#374151", margin:0 }}>
                  {recipe.name && <span style={{ color:"#4f46e5" }}>"{recipe.name}"</span>}
                  {" "}— {recipe.ingredients.length} ingredients found
                </p>
                <button
                  onClick={() => setSel(sel.size === recipe.ingredients.length
                    ? new Set()
                    : new Set(recipe.ingredients.map((_, i) => i)))}
                  style={{ background:"none", border:"none", cursor:"pointer",
                           fontSize:12, color:"#6366f1", fontWeight:600 }}>
                  {sel.size === recipe.ingredients.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {recipe.ingredients.map((ing, i) => (
                  <button key={i} onClick={() => toggle(i)}
                    style={{ width:"100%", textAlign:"left", display:"flex", alignItems:"center",
                             gap:10, padding:"10px 12px", borderRadius:12, border:"none", cursor:"pointer",
                             fontSize:13, transition:"all 0.15s",
                             background: sel.has(i) ? "#eef2ff" : "#f9fafb",
                             color: sel.has(i) ? "#3730a3" : "#6b7280" }}>
                    <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                                  border: sel.has(i) ? "2px solid #6366f1" : "2px solid #d1d5db",
                                  background: sel.has(i) ? "#6366f1" : "transparent",
                                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {sel.has(i) && <Check size={10} color="#fff" />}
                    </div>
                    {ing}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer confirm button */}
        {status === "preview" && (
          <div style={{ padding:"12px 20px 16px", borderTop:"1px solid #f1f1f1", flexShrink:0 }}>
            <button onClick={confirm} disabled={sel.size === 0}
              style={{ width:"100%", padding:"14px 0", background:"#4f46e5", color:"#fff",
                       border:"none", borderRadius:14, fontSize:14, fontWeight:700,
                       cursor: sel.size === 0 ? "not-allowed" : "pointer",
                       opacity: sel.size === 0 ? 0.5 : 1 }}>
              Add {sel.size} ingredient{sel.size !== 1 ? "s" : ""} to Grocery List
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

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
  const [importOpen,       setImportOpen]       = useState(false);

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

  const addFromUrl = (ingredients, recipeName) => {
    const newItems = ingredients.map(raw => ({
      id: uid(), name: raw, quantity: "", unit: "",
      checked: false, category: categorize(raw),
      sources: recipeName ? [recipeName] : [],
    }));
    setMealPlanner(p => ({ ...p, groceryList: [...p.groceryList, ...newItems] }));
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
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors">
            <Link size={13} /> Import URL
          </button>
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
          <p className="text-xs mt-1">Add items manually or import from a recipe URL</p>
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

      {/* Import modal — rendered via portal so it floats above the nav bar */}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onAdd={addFromUrl} />}

      {/* Clear all confirmation — also via portal */}
      {clearAllConfirm && createPortal(
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
                   display:"flex", alignItems:"center", justifyContent:"center",
                   zIndex: 350, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setClearAllConfirm(false); }}
        >
          <div style={{ background:"#fff", borderRadius:20, padding:24,
                        boxShadow:"0 8px 40px rgba(0,0,0,0.18)", width:"100%", maxWidth:300 }}>
            <p style={{ fontWeight:700, color:"#1f2937", fontSize:15, margin:"0 0 6px" }}>Clear entire list?</p>
            <p style={{ fontSize:13, color:"#6b7280", margin:"0 0 20px" }}>
              This removes all {totalCount} items and cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setClearAllConfirm(false)}
                style={{ flex:1, padding:"11px 0", border:"1px solid #e5e7eb", borderRadius:12,
                         fontSize:13, color:"#374151", background:"#fff", cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={clearAll}
                style={{ flex:1, padding:"11px 0", background:"#dc2626", color:"#fff",
                         border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
