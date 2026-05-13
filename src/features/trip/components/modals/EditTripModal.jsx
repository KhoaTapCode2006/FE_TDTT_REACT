import { useState } from "react";
import TripDateRangePicker from "../TripDateRangePicker";

// ─── EditTripModal ────────────────────────────────────────────────────────────
function EditTripModal({ trip, onClose, onSave }) {
  const [title,      setTitle]      = useState(trip.title);
  const [placeId,    setPlaceId]    = useState(trip.place_id ?? trip.description ?? "");
  const [dateFrom,   setDateFrom]   = useState(trip.dateFrom ?? "");
  const [dateTo,     setDateTo]     = useState(trip.dateTo ?? "");
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...trip,
      title:       title.trim(),
      description: placeId.trim(),
      dateFrom,
      dateTo,
      dateRange: dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : trip.dateRange,
    });
    onClose();
  };

  function fmtRange() {
    if (!dateFrom && !dateTo) return "Select dates";
    const fmt = (iso) => {
      if (!iso) return "?";
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };
    if (dateFrom && !dateTo) return `${fmt(dateFrom)} → ?`;
    return `${fmt(dateFrom)} → ${fmt(dateTo)}`;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="px-8 pt-8 pb-0 shrink-0">
            <h3 className="text-base font-bold text-gray-900">Edit Trip</h3>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 pt-5 pb-4">
            <div className="flex flex-col gap-5">
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

              {/* Date Range */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Dates</label>
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 hover:border-blue-300 hover:ring-2 hover:ring-blue-100 transition text-left"
                >
                  <span className="text-blue-500">📅</span>
                  <span className={dateFrom ? "text-gray-700 font-medium" : "text-gray-400"}>
                    {fmtRange()}
                  </span>
                </button>

                {showPicker && (
                  <TripDateRangePicker
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
                    onDone={() => setShowPicker(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Fixed footer — actions */}
          <div className="px-8 py-5 border-t border-gray-100 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-6">
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
            </form>
          </div>

        </div>
      </div>
    </>
  );
}

export default EditTripModal;
