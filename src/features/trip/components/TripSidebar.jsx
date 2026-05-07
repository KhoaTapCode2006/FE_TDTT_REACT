import { NAV_ITEMS } from "../hooks/useTrip";

// ─── TripSidebar ──────────────────────────────────────────────────────────────
// Panel nav trái: logo, danh sách filter (All / Waiting / Active / Ended),
// và nút "Create New Trip".
function TripSidebar({ activeNav, onNavChange, onOpenCreate }) {
  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
      {/* Brand */}
      <div className="mb-8 px-2">
        <p className="text-base font-bold text-gray-900">Trip</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              activeNav === item.id
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Create button */}
      <button
        onClick={onOpenCreate}
        className="flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-700 transition-colors mt-4"
      >
        <span className="text-lg leading-none">+</span>
        Create New Trip
      </button>
    </aside>
  );
}

export default TripSidebar;
