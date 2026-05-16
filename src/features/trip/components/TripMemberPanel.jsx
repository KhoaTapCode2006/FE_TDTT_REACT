import { MEMBER_COLORS } from "./modals/TripMapModal";
import { useTripMembers } from "../hooks/useTripMembers";

// ─── TripMemberPanel ───────────────────────────────────────────────────────────
// Hiển thị danh sách thành viên của trip dưới dạng panel inline.
// Dùng cho tab "Member" trong TripPage.

export default function TripMemberPanel({ trip, onRemoveMember }) {
  const { members: firestoreMembers } = useTripMembers(trip?.id ?? null);

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-4xl mb-3">👥</span>
        <p className="text-sm font-medium">Chọn một chuyến đi để xem thành viên</p>
      </div>
    );
  }

  const toDate = (val) => {
    if (!val) return null;
    if (typeof val.toDate === "function") return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">{trip.title}</h2>
        <p className="text-xs text-gray-400 mb-4">
          {firestoreMembers.length} thành viên
        </p>

        {firestoreMembers.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Chưa có thành viên</p>
        )}

        <div className="flex flex-col gap-1">
          {firestoreMembers.map((m, i) => {
            const joinedDate = toDate(m.joined_at);
            const joinedStr = joinedDate
              ? joinedDate.toLocaleString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : null;

            return (
              <div key={m.uid} className="flex items-center gap-3 group py-2 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                >
                  {m.uid.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs text-gray-700 font-mono truncate">{m.uid}</span>
                  {joinedStr && (
                    <span className="text-[10px] text-gray-400 mt-0.5">Joined {joinedStr}</span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveMember(trip.id, m.uid)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remove member"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
