import { useState } from "react";

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

  const [date, setDate] = useState(defaultDt.date);
  const [time, setTime] = useState(defaultDt.time);

  function handleNow() {
    onConfirm(null); // null = thực hiện ngay lập tức
  }

  function handleSchedule() {
    if (!date || !time) return;
    const scheduled = new Date(`${date}T${time}:00`);
    if (isNaN(scheduled.getTime())) return;
    onConfirm(scheduled);
  }

  // Format preview
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
              {isStart ? "🟢 Bắt đầu chuyến đi" : "🏁 Kết thúc chuyến đi"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 truncate">{tripName}</p>
          </div>

          {/* Date + Time pickers */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Ngày</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Giờ</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>
          </div>

          {/* Preview */}
          {previewDt && (
            <div className={`text-xs px-3 py-2 rounded-lg ${isPast ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              {isPast
                ? "⚠ Thời gian đã qua — sẽ thực hiện ngay"
                : `⏰ Lên lịch: ${previewDt}`}
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
