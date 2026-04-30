import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import MealCell from "./MealCell.jsx";
import RecipePanel from "./RecipePanel.jsx";

const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const getMonday = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtShort = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function WeeklyCalendarGrid({ mealPlanner, setMealPlanner }) {
  const [weekStart,   setWeekStart]   = useState(getMonday);
  const [activeCell,  setActiveCell]  = useState(null); // { date, mealType }
  const [addingType,  setAddingType]  = useState(false);
  const [newType,     setNewType]     = useState("");

  const today     = toStr(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd   = weekDates[6];

  const prev = () => setWeekStart((d) => addDays(d, -7));
  const next = () => setWeekStart((d) => addDays(d, 7));

  const getMeal = (date, mealType) =>
    mealPlanner.meals.find((m) => m.date === date && m.mealType === mealType) || null;

  const clearMeal = (date, mealType) =>
    setMealPlanner((p) => ({ ...p, meals: p.meals.filter((m) => !(m.date === date && m.mealType === mealType)) }));

  const addMealType = () => {
    const name = newType.trim();
    if (!name || mealPlanner.mealTypes.includes(name)) { setAddingType(false); setNewType(""); return; }
    setMealPlanner((p) => ({ ...p, mealTypes: [...p.mealTypes, name] }));
    setNewType(""); setAddingType(false);
  };

  const activeCell_meal = activeCell ? getMeal(activeCell.date, activeCell.mealType) : null;

  return (
    <div>
      {/* Week navigator */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-700">
          {fmtShort(weekStart)} – {fmtShort(weekEnd)}, {weekEnd.getFullYear()}
        </span>
        <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Horizontally scrollable grid */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div style={{ minWidth: 580 }}>
          {/* Day header row */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}>
            <div />
            {weekDates.map((d, i) => (
              <div key={i} className={`text-center py-1.5 rounded-xl text-xs ${toStr(d) === today ? "bg-indigo-600 text-white font-bold" : "text-gray-500 font-semibold"}`}>
                <div>{DAYS_SHORT[i]}</div>
                <div className="text-sm">{d.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Meal type rows */}
          {mealPlanner.mealTypes.map((mealType) => (
            <div key={mealType} className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}>
              <div className="flex items-center pr-1">
                <span className="text-xs font-semibold text-gray-500 truncate">{mealType}</span>
              </div>
              {weekDates.map((d, i) => {
                const dateStr = toStr(d);
                return (
                  <MealCell
                    key={i}
                    meal={getMeal(dateStr, mealType)}
                    onClick={() => setActiveCell({ date: dateStr, mealType })}
                    onClear={() => clearMeal(dateStr, mealType)}
                  />
                );
              })}
            </div>
          ))}

          {/* Add meal type row */}
          <div className="mt-4" style={{ paddingLeft: 80 }}>
            {addingType ? (
              <div className="flex items-center gap-2">
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  autoFocus
                  placeholder="e.g. Snack"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addMealType();
                    if (e.key === "Escape") { setAddingType(false); setNewType(""); }
                  }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button onClick={addMealType} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">Add</button>
                <button onClick={() => { setAddingType(false); setNewType(""); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingType(true)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                <Plus size={13} /> Add Meal Type
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recipe side panel */}
      {activeCell && (
        <RecipePanel
          cell={activeCell}
          meal={activeCell_meal}
          mealPlanner={mealPlanner}
          setMealPlanner={setMealPlanner}
          onClose={() => setActiveCell(null)}
        />
      )}
    </div>
  );
}
