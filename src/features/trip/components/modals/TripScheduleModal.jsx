import { useState } from "react";

// ─── Calendar constants ───────────────────────────────────────────────────────
const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function buildCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  return cells;
}

function toISO(d) {
  if (!d) return "";
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function fmtShort(iso) {
  if (!iso) return "Chọn ngày";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "Chọn ngày";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── SingleDatePicker ─────────────────────────────────────────────────────────
function SingleDatePicker({ value, onChange, onDone }) {
  const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const selD  = value ? (() => { const d = new Date(value + "T00:00:00"); return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()); })() : null;

  const [viewDate, setViewDate] = useState(
    selD
      ? new Date(selD.getFullYear(), selD.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  );

  function dayClass(d) {
    if (!d) return "w-9 h-9";
    const isPast  = d < today;
    const isSel   = selD && d.getTime() === selD.getTime();
    const isToday = d.getTime() === today.getTime();

    if (isPast) return "w-9 h-9 flex items-center justify-center text-sm rounded-full text-gray-300 cursor-not-allowed select-none";
    let base = "w-9 h-9 flex items-center justify-center text-sm rounded-full cursor-pointer select-none transition-colors";
    if (isSel)   return base + " bg-blue-600 text-white font-bold";
    if (isToday) return base + " border border-blue-400 text-blue-600 font-semibold hover:bg-blue-50";
    return base + " text-gray-700 hover:bg-gray-100";
  }

  const cells = buildCells(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-blue-600">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="w-9 h-8 flex items-center justify-center text-[11px] font-bold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => (
          <div
            key={i}
            className={dayClass(d)}
            onClick={() => {
              if (!d || d < today) return;
              onChange(toISO(d));
            }}
          >
            {d ? d.getDate() : ""}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onChange("")}
          className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─── TripScheduleModal ────────────────────────────────────────────────────────
// Popup chọn ngày giờ để lên lịch Start hoặc End trip.
// Props:
//   action   — "start" | "end"
//   tripName — tên trip để hiển thị
//   onConfirm(scheduledAt: Date | null) — null = thực hiện ngay
//   onClose  — đóng popup
function TripScheduleModal({ action, tripName, onConfirm, onClose }) {
  const isStart = action === "start";
  const label   = isStart ? "Start" : "End";
  const color   = isStart ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-900";

  // Default: ngày hôm nay, giờ hiện tại + 5 phút
  const defaultDt = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  })();

  const [date, setDate]           = useState(defaultDt.date);
  const [time, setTime]           = useState(defaultDt.time);
  const [showCalendar, setShowCalendar] = useState(false);

  function handleNow() {
    onConfirm(null);
  }

  function handleSchedule() {
    if (!date || !time) return;
    const scheduled = new Date(`${date}T${time}:00`);
    if (isNaN(scheduled.getTime())) return;
    onConfirm(scheduled);
  }

  const previewDt = (() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("vi-VN", {
      weekday: "short", day: "2-digit", month: "2-digit",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  })();

  const isPast = (() => {
    if (!date || !time) return false;
    return new Date(`${date}T${time}:00`) <= new Date();
  })();

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">

          {/* Header */}
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isStart ? "Bắt đầu chuyến đi" : "Kết thúc chuyến đi"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 truncate">{tripName}</p>
          </div>

          {/* Date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Ngày</label>
            <button
              type="button"
              onClick={() => setShowCalendar((v) => !v)}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 hover:border-blue-300 hover:ring-2 hover:ring-blue-100 transition text-left"
            >
              <span className={date ? "text-gray-700 font-medium" : "text-gray-400"}>
                {fmtShort(date)}
              </span>
            </button>

            {showCalendar && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center">
                <div className="fixed inset-0 bg-black/20" onClick={() => setShowCalendar(false)} />
                <div className="relative z-10">
                  <SingleDatePicker
                    value={date}
                    onChange={(iso) => setDate(iso)}
                    onDone={() => setShowCalendar(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Giờ</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
            />
          </div>

          {/* Preview */}
          {previewDt && (
            <div className={`text-xs px-3 py-2 rounded-lg ${isPast ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              {isPast
                ? "Thời gian đã qua — sẽ thực hiện ngay"
                : `Lên lịch: ${previewDt}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSchedule}
              disabled={!date || !time}
              className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
            >
              {isPast ? `${label} ngay` : `Lên lịch ${label}`}
            </button>
            <button
              onClick={handleNow}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Thực hiện ngay
            </button>
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center pt-1"
            >
              Huỷ
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default TripScheduleModal;
