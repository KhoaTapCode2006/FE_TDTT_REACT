import { useState } from "react";

// ─── EditTripModal ────────────────────────────────────────────────────────────
// Modal chỉnh sửa thông tin trip: tên, place ID, trạng thái, ngày bắt đầu/kết thúc.
function EditTripModal({ trip, onClose, onSave }) {
  const [title,    setTitle]    = useState(trip.title);
  const [placeId,  setPlaceId]  = useState(trip.description ?? "");
  const [status,   setStatus]   = useState(trip.status);
  const [dateFrom, setDateFrom] = useState(trip.dateFrom ?? "");
  const [dateTo,   setDateTo]   = useState(trip.dateTo ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...trip,
      title:       title.trim(),
      description: placeId.trim(),
      status,
      dateFrom,
      dateTo,
      dateRange:   dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : trip.dateRange,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col gap-6">
          <h3 className="text-base font-bold text-gray-900">Edit Trip</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Trip Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Trip Name</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Place ID */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Place ID</label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                maxLength={300}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              >
                <option value="waiting">⏳ Waiting — Chưa bắt đầu</option>
                <option value="active">🟢 Active — Đang diễn ra</option>
                <option value="ended">🏁 Ended — Đã kết thúc</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Start Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">End Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-1">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditTripModal;
