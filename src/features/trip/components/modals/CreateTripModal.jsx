import { useState } from "react";
import TripDateRangePicker from "../TripDateRangePicker";
import HotelSearchAutocomplete from "../HotelSearchAutocomplete";

// ─── CreateTripModal ──────────────────────────────────────────────────────────
function CreateTripModal({ onClose, onCreate }) {
  const [title,        setTitle]       = useState("");
  const [placeId,      setPlaceId]     = useState("");
  const [placeDisplay, setPlaceDisplay] = useState("");
  const [dateFrom,     setDateFrom]    = useState("");
  const [dateTo,       setDateTo]      = useState("");
  const [showPicker,   setShowPicker]  = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), place_id: placeId, dateFrom, dateTo });
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

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 pt-8 pb-4">
            <div className="flex flex-col gap-6">
              {/* Trip Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Trip Name</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Amalfi Coast Expedition"
                  maxLength={60}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>

              {/* Destination Hotel */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Destination Hotel</label>
                <HotelSearchAutocomplete
                  value={placeId}
                  displayValue={placeDisplay}
                  onChange={({ placeId: id, display }) => {
                    setPlaceId(id);
                    setPlaceDisplay(display);
                  }}
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
                  <span className={dateFrom ? "text-gray-700 font-medium" : "text-gray-400"}>
                    {fmtRange()}
                  </span>
                </button>

                {showPicker && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/20" onClick={() => setShowPicker(false)} />
                    <div className="relative z-10 bg-white rounded-2xl shadow-2xl">
                      <TripDateRangePicker
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
                        onDone={() => setShowPicker(false)}
                      />
                    </div>
                  </div>
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
                Create Trip
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

export default CreateTripModal;
