import { useState } from "react";
import { MEMBER_COLORS } from "./modals/TripMapModal";
import ConfirmModal from "./modals/ConfirmModal";
import TripScheduleModal from "./modals/TripScheduleModal";
import { useTripMembers } from "../hooks/useTripMembers";

// ─── TripInfoPanel ─────────────────────────────────────────────────────────────
// Hiển thị thông tin chi tiết của một trip dưới dạng panel inline (không phải modal).
// Dùng cho tab "Info" trong TripPage.

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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold text-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 break-all">{value}</span>
    </div>
  );
}

export default function TripInfoPanel({ trip, onRemoveMember, onEdit, onDelete, onLeave, onUpdateStatus, currentUid }) {
  const [confirm, setConfirm] = useState(null); // { type: "delete"|"leave"|"start"|"end" }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-4xl mb-3">ℹ️</span>
        <p className="text-sm font-medium">Chọn một chuyến đi để xem thông tin</p>
      </div>
    );
  }

  const isOwner = currentUid && trip.owner_uid && currentUid === trip.owner_uid;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-8 py-3 mb-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{trip.title}</h2>
              <p className="text-xs text-gray-400">ID: {trip.id}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeStyle[trip.status]}`}>
              {badgeLabel[trip.status]}
            </span>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              <>
                {/* Start / End status buttons */}
                {onUpdateStatus && trip.status === "waiting" && (
                  <button
                    onClick={() => setConfirm({ type: "start" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Start
                  </button>
                )}
                {onUpdateStatus && trip.status === "active" && (
                  <button
                    onClick={() => setConfirm({ type: "end" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14v14H5z" />
                    </svg>
                    End
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(trip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Cập nhật
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setConfirm({ type: "delete" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                )}
              </>
            ) : (
              onLeave && (
                <button
                  onClick={() => setConfirm({ type: "leave" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Rời trip
                </button>
              )
            )}
          </div>
        </div>
        {/* Meta row: tất cả thông tin trên 1 hàng ngang */}
        <div className="flex items-center gap-6 flex-wrap">
          {/* Owner */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Owner</span>
            <span className="text-xs text-gray-700 font-medium">
              {trip.owner?.display_name || trip.owner?.username || trip.owner_uid || "—"}
            </span>
          </div>

          <span className="text-gray-200 text-sm">|</span>

          {/* Dates */}
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-600">
              {trip.dateFrom ? fmtDate(trip.dateFrom) : "—"}
              <span className="mx-1 text-gray-300">→</span>
              {trip.dateTo ? fmtDate(trip.dateTo) : "—"}
            </span>
          </div>

          <span className="text-gray-200 text-sm">|</span>

          {/* Created / Updated */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tạo</span>
            <span className="text-xs text-gray-600">{trip.created_at ? fmtDate(trip.created_at) : "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cập nhật</span>
            <span className="text-xs text-gray-600">{trip.updated_at ? fmtDate(trip.updated_at) : "—"}</span>
          </div>

          {/* Place */}
          {(trip.place?.name || trip.place_id) && (
            <>
              <span className="text-gray-200 text-sm">|</span>
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-gray-700 font-medium">{trip.place?.name || trip.place_id}</span>
                {trip.place?.link && (
                  <a href={trip.place.link} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-500 hover:underline ml-1">↗</a>
                )}
              </div>
            </>
          )}

          {/* Place thumbnail */}
          {(trip.place?.thumbnail_url || trip.place?.images?.[0]?.thumbnail) && (
            <img
              src={trip.place?.thumbnail_url || trip.place.images[0].thumbnail}
              alt={trip.place?.name}
              className="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0"
            />
          )}
        </div>
      </div>

      {/* Confirm modals */}
      {confirm?.type === "delete" && (
        <ConfirmModal
          title="Xóa chuyến đi?"
          message={`Chuyến đi "${trip.title}" sẽ bị xóa vĩnh viễn.`}
          confirmLabel="Xóa"
          onConfirm={() => { setConfirm(null); onDelete(trip.id); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === "leave" && (
        <ConfirmModal
          title="Rời chuyến đi?"
          message={`Bạn sẽ rời khỏi chuyến đi "${trip.title}".`}
          confirmLabel="Rời trip"
          confirmClassName="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          onConfirm={() => { setConfirm(null); onLeave(trip.id); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {(confirm?.type === "start" || confirm?.type === "end") && (
        <TripScheduleModal
          action={confirm.type}
          tripName={trip.title}
          onConfirm={(scheduledAt) => {
            const newStatus = confirm.type === "start" ? "active" : "ended";
            setConfirm(null);
            onUpdateStatus(trip.id, newStatus, scheduledAt);
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
