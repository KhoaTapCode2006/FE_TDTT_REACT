import { MEMBER_COLORS } from "./modals/TripMapModal";
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

export default function TripInfoPanel({ trip, onRemoveMember }) {
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-4xl mb-3">ℹ️</span>
        <p className="text-sm font-medium">Chọn một chuyến đi để xem thông tin</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-bold text-gray-900">{trip.title}</h2>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeStyle[trip.status]}`}>
            {badgeLabel[trip.status]}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-mono mb-4 truncate">{trip.id}</p>

        <div className="flex flex-col gap-3">
          <InfoRow label="Owner"  value={trip.owner?.display_name || trip.owner?.username || trip.owner_uid || "—"} />
          <InfoRow label="Place"  value={trip.place?.name || trip.place_id || "—"} />
          {trip.description && (
            <InfoRow label="Description" value={trip.description} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Start At</span>
            <span className="text-xs text-gray-700">{fmtDate(trip.dateFrom)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">End At</span>
            <span className="text-xs text-gray-700">{fmtDate(trip.dateTo)}</span>
          </div>
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
    </div>
  );
}
