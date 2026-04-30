import { X } from "lucide-react";

export default function MealCell({ meal, onClick, onClear }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-16 rounded-xl border-2 transition-all group text-left overflow-hidden"
      style={{
        borderColor: meal ? (meal.colorTag || "#6366F1") : "#E5E7EB",
        background:  meal ? `${meal.colorTag || "#6366F1"}18` : "white",
      }}
    >
      {meal ? (
        <div className="px-2 py-1.5 h-full flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 pr-3">{meal.recipeName}</p>
          <div style={{ background: meal.colorTag || "#6366F1" }} className="w-1.5 h-1.5 rounded-full" />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-200 group-hover:text-indigo-400 transition-colors">
          <span className="text-2xl font-thin leading-none">+</span>
        </div>
      )}
    </button>
  );
}
