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
        Tạo chuyến đi mới
      </button>

      {/* Join trip */}
      <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-3 py-3 flex flex-col gap-2 overflow-hidden relative">
        {/* Decorative map pins */}
        <svg className="absolute right-2 top-2 w-4 h-4 text-green-300 opacity-60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
        <svg className="absolute right-6 bottom-3 w-3 h-3 text-green-400 opacity-40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>

        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">Tham gia chuyến đi</p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">Nhập ID chuyến đi để tham gia cùng bạn bè.</p>
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
          <input
            type="text"
            placeholder="Nhập ID chuyến đi"
            className="flex-1 text-xs text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
          />
          <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1019 5.636" />
            </svg>
          </button>
        </div>

        {/* Join button */}
        <button className="w-full bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
          Tham gia chuyến đi
        </button>
      </div>
    </aside>
  );
}

export default TripSidebar;
