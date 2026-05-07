import { MEMBER_COLORS } from "./TripMapModal";

// ─── TripInfoModal ────────────────────────────────────────────────────────────
// Modal hiển thị toàn bộ thông tin raw của một trip theo dạng key-value table.
// Cho phép xóa từng member khỏi trip.
function TripInfoModal({ trip, onClose, onRemoveMember }) {
  const badgeStyle = {
    waiting: "bg-yellow-100 text-yellow-800",
    active:  "bg-green-100 text-green-800",
    ended:   "bg-gray-200 text-gray-700",
  };
  const badgeLabel = { waiting: "Waiting", active: "Active", ended: "Ended" };

  const memberUids = Array.isArray(trip.member_uids) ? trip.member_uids : [];

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d    = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const date = d.toISOString().slice(0, 10);
    const hh   = String(d.getUTCHours()).padStart(2, "0");
    const mm   = String(d.getUTCMinutes()).padStart(2, "0");
    return `${date}  ${hh} : ${mm}`;
  };

  const rows = [
    { label: "id",         value: trip.id },
    { label: "owner_uid",  value: trip.owner_uid || "—" },
    { label: "name",       value: trip.title },
    { label: "place_id",   value: trip.place_id || "—" },
    { label: "start_at",   value: fmtDate(trip.dateFrom) },
    { label: "end_at",     value: fmtDate(trip.dateTo) },
    {
      label: "status",
      value: (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle[trip.status]}`}>
          {badgeLabel[trip.status]}
        </span>
      ),
    },
    {
      label: "member_uids",
      value:
        memberUids.length > 0 ? (
          <div className="flex flex-col gap-2">
            {memberUids.map((uid, i) => (
              <div key={uid} className="flex items-center gap-2.5 group">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                >
                  {uid.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 font-mono flex-1">{uid}</span>
                <button
                  onClick={() => onRemoveMember(trip.id, uid)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove member"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : "—",
    },
    { label: "created_at", value: fmtDate(trip.created_at) },
    { label: "updated_at", value: fmtDate(trip.updated_at) },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Trip Info</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start gap-4 py-3">
                <span className="text-sm font-semibold text-gray-600 w-28 shrink-0 pt-0.5 capitalize">
                  {row.label.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-gray-800 break-all">{row.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default TripInfoModal;
