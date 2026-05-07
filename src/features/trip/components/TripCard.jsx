import { MEMBER_COLORS } from "./modals/TripMapModal";

// ─── TripCard ─────────────────────────────────────────────────────────────────
// Card hiển thị thông tin một chuyến đi: tên, trạng thái, mô tả, ngày, danh sách member.
// Có 4 action button: info, view map, edit, delete.
function TripCard({ trip, onDelete, onEdit, onView, onInfo, onAddMember }) {
  const isEnded = trip.status === "ended";

  const memberUids  = Array.isArray(trip.member_uids) ? trip.member_uids : [];
  const memberCount = memberUids.length;
  const showMax     = 3;
  const visibleUids = memberUids.slice(0, showMax);
  const extraCount  = Math.max(0, memberCount - showMax);

  const badgeStyle = {
    waiting: "bg-yellow-100 text-yellow-800",
    active:  "bg-green-100 text-green-800",
    ended:   "bg-gray-800/70 text-white",
  };

  const badgeLabel = {
    waiting: "Waiting",
    active:  "Active",
    ended:   "Ended",
  };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      style={{ minHeight: "200px" }}
    >
      <div className="p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle[trip.status]}`}>
              {badgeLabel[trip.status]}
            </span>
            <h3 className={`font-semibold text-gray-900 text-base truncate ${isEnded ? "text-gray-500" : ""}`}>
              {trip.title}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onInfo(trip)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>
            <button
              onClick={() => onView(trip)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="View map"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(trip)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(trip.id)}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">
          {trip.description}
        </p>

        {/* Date */}
        <div className={`flex items-center gap-2 text-xs mb-2 ${isEnded ? "text-gray-400 line-through" : "text-gray-500"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {trip.dateRange}
        </div>

        {/* Members */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {memberCount} Members
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddMember(trip)}
              className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-base leading-none"
              title="Add member"
            >
              +
            </button>
            <div className="flex items-center">
              {visibleUids.map((uid, i) => (
                <div
                  key={uid}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background:  MEMBER_COLORS[i % MEMBER_COLORS.length],
                    marginLeft:  i > 0 ? "-8px" : "0",
                  }}
                  title={uid}
                >
                  {uid.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {extraCount > 0 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600"
                  style={{ marginLeft: "-8px" }}
                >
                  +{extraCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripCard;
