import { useState } from "react";
import { MEMBER_COLORS } from "./modals/TripMapModal";
import ConfirmModal from "./modals/ConfirmModal";
import { useTripMembers } from "../hooks/useTripMembers";

// ─── TripMemberPanel ───────────────────────────────────────────────────────────
// Hiển thị danh sách thành viên của trip dưới dạng panel inline.
// Dùng cho tab "Member" trong TripPage.

export default function TripMemberPanel({ trip, onRemoveMember, onAddMember, refreshKey = 0 }) {
  const { members: firestoreMembers } = useTripMembers(trip?.id ?? null, refreshKey);
  const [confirmRemove, setConfirmRemove] = useState(null); // { uid, display_name }

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
    <div className="w-full h-full">
      <div className="bg-white border-b border-gray-100 shadow-sm px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">{trip.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{firestoreMembers.length} thành viên</p>
        </div>
        <button
          onClick={() => onAddMember?.(trip)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      <div className="px-8 py-4">
        {firestoreMembers.length === 0 && (
          <p className="text-xs text-gray-400 py-8 text-center">Chưa có thành viên</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {firestoreMembers.map((m, i) => {
            const joinedDate = toDate(m.joined_at);
            const joinedStr = joinedDate
              ? joinedDate.toLocaleString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : null;

            return (
              <div key={m.uid} className="flex items-center gap-3 group py-3 px-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                  style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                >
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={m.display_name ?? m.uid} className="w-full h-full object-cover" />
                    : (m.display_name ?? m.username ?? m.uid).slice(0, 2).toUpperCase()
                  }
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm text-gray-800 font-semibold truncate">
                    {m.display_name ?? m.username ?? m.uid}
                  </span>
                  {m.username && m.display_name && (
                    <span className="text-[11px] text-gray-400 truncate">@{m.username}</span>
                  )}
                  {joinedStr && (
                    <span className="text-[10px] text-gray-400 mt-0.5">Joined {joinedStr}</span>
                  )}
                </div>
                <button
                  onClick={() => setConfirmRemove({ uid: m.uid, display_name: m.display_name ?? m.username ?? m.uid })}
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

      {confirmRemove && (
        <ConfirmModal
          title="Xóa thành viên?"
          message={`Bạn có chắc muốn xóa "${confirmRemove.display_name}" khỏi chuyến đi này?`}
          confirmLabel="Xóa"
          onConfirm={() => { onRemoveMember(trip.id, confirmRemove.uid); setConfirmRemove(null); }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}
