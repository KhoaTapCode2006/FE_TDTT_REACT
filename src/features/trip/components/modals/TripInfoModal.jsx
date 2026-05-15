import { useState } from "react";
import { MEMBER_COLORS } from "./TripMapModal";
import { useTripMembers } from "../../hooks/useTripMembers";

// ─── TripInfoModal ────────────────────────────────────────────────────────────
// 2 tabs: Info | Members
function TripInfoModal({ trip, onClose, onRemoveMember }) {
  const [activeTab, setActiveTab] = useState("info");

  // Realtime members từ Firestore
  const { members: firestoreMembers } = useTripMembers(trip.id);
  const memberUids = firestoreMembers.map((m) => m.uid);

  const badgeStyle = {
    waiting: "bg-yellow-100 text-yellow-800",
    active:  "bg-green-100 text-green-800",
    ended:   "bg-gray-200 text-gray-700",
  };
  const badgeLabel = { waiting: "Waiting", active: "Active", ended: "Ended" };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit",
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const tabs = [
    { id: "info",    label: "Info" },
    { id: "members", label: `Members (${memberUids.length})` },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">

          {/* Header — title + status badge cùng hàng */}
          <div className="px-6 pt-5 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-base font-bold text-gray-900 shrink-0">Trip Info:</h3>
                <span className="text-base font-semibold text-gray-800 truncate">{trip.title}</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-2 ${badgeStyle[trip.status]}`}>
                {badgeLabel[trip.status]}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono mb-3 truncate">{trip.id}</p>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content — chiều cao cố định để modal không thay đổi kích thước */}
          <div className="overflow-y-auto" style={{ height: "340px" }}>

            {/* Info tab */}
            {activeTab === "info" && (
              <div className="px-6 py-4 flex flex-col gap-4">

                {/* Owner, Place */}
                {[
                  { label: "Owner", value: trip.owner?.display_name || trip.owner?.username || trip.owner_uid || "—" },
                  { label: "Place", value: trip.place?.name || trip.place_id || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-gray-400 w-20 shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-xs text-gray-800 break-all">{row.value}</span>
                  </div>
                ))}

                {/* Start / End — ngang */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Start At</span>
                    <span className="text-xs text-gray-700">{fmtDate(trip.dateFrom)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">End At</span>
                    <span className="text-xs text-gray-700">{fmtDate(trip.dateTo)}</span>
                  </div>
                </div>

                {/* Created / Updated — ngang */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Created</span>
                    <span className="text-xs text-gray-700">{fmtDate(trip.created_at)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Updated</span>
                    <span className="text-xs text-gray-700">{fmtDate(trip.updated_at)}</span>
                  </div>
                </div>

              </div>
            )}

            {/* Members tab */}
            {activeTab === "members" && (
              <div className="px-6 py-4 flex flex-col gap-2">
                {memberUids.length === 0 && (
                  <p className="text-xs text-gray-400 py-4 text-center">Chưa có thành viên</p>
                )}
                {(firestoreMembers.length > 0 ? firestoreMembers : memberUids.map((uid) => ({ uid, joined_at: null }))).map((m, i) => {
                  // joined_at từ Firestore là Timestamp object { seconds, nanoseconds }
                  // cần dùng .toDate() thay vì new Date()
                  const toDate = (val) => {
                    if (!val) return null;
                    if (typeof val.toDate === "function") return val.toDate();
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? null : d;
                  };
                  const joinedDate = toDate(m.joined_at);
                  const joinedStr = joinedDate
                    ? joinedDate.toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : null;
                  return (
                    <div key={m.uid} className="flex items-center gap-3 group py-1">
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
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default TripInfoModal;
