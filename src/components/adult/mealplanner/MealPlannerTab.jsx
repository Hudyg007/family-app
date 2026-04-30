import { useState } from "react";
import { BookOpen, ShoppingCart } from "lucide-react";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid.jsx";
import GroceryList        from "./GroceryList.jsx";
import RecipeLibrary      from "./RecipeLibrary.jsx";

export const DEFAULT_MEAL_PLANNER = {
  mealTypes:     ["Breakfast", "Lunch", "Dinner"],
  meals:         [],
  recipeLibrary: [],
  groceryList:   [],
};

export default function MealPlannerTab({ mealPlanner, setMealPlanner }) {
  const [view,        setView]        = useState("calendar"); // "calendar" | "grocery"
  const [showLibrary, setShowLibrary] = useState(false);

  const groceryUnchecked = (mealPlanner.groceryList || []).filter((i) => !i.checked).length;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🍽️ Meal Planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan the week and build your grocery list</p>
        </div>
        <button
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
          <BookOpen size={15} /> My Recipes
        </button>
      </div>

      {/* View toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === "calendar" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          📅 Weekly Plan
        </button>
        <button
          onClick={() => setView("grocery")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === "grocery" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <ShoppingCart size={14} /> Grocery List
          {groceryUnchecked > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {groceryUnchecked}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {view === "calendar" && (
        <WeeklyCalendarGrid mealPlanner={mealPlanner} setMealPlanner={setMealPlanner} />
      )}
      {view === "grocery" && (
        <GroceryList mealPlanner={mealPlanner} setMealPlanner={setMealPlanner} />
      )}

      {/* Recipe Library modal */}
      {showLibrary && (
        <RecipeLibrary mealPlanner={mealPlanner} setMealPlanner={setMealPlanner} onClose={() => setShowLibrary(false)} />
      )}
    </div>
  );
}
