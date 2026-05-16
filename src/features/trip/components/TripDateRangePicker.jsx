import { useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISO(d) {
  if (!d) return "";
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function fmtShort(d) {
  if (!d) return "Select date";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ─── TripDateRangePicker ──────────────────────────────────────────────────────
// Props:
//   dateFrom  — ISO string (YYYY-MM-DD) hoặc ""
//   dateTo    — ISO string (YYYY-MM-DD) hoặc ""
//   onChange  — ({ dateFrom, dateTo }) => void
//   onDone    — () => void  (khi nhấn Done)
function TripDateRangePicker({ dateFrom, dateTo, onChange, onDone }) {
  const today   = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const startD  = toDate(dateFrom);
  const endD    = toDate(dateTo);

  const [viewDate, setViewDate] = useState(
    startD
      ? new Date(startD.getFullYear(), startD.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [hovered, setHovered] = useState(null);

  const nextMo = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

  // ── Day click ──────────────────────────────────────────────────────────────
  function handleDay(d) {
    if (!d) return;
    if (d < today) return; // không cho chọn ngày quá khứ

    if (!startD) {
      onChange({ dateFrom: toISO(d), dateTo: "" });
      return;
    }
    if (startD && !endD) {
      if (d < startD) {
        onChange({ dateFrom: toISO(d), dateTo: "" });
      } else if (d > startD) {
        onChange({ dateFrom: toISO(startD), dateTo: toISO(d) });
      }
      return;
    }
    // Cả 2 đã chọn → reset về start mới
    onChange({ dateFrom: toISO(d), dateTo: "" });
  }

  // ── Day CSS ────────────────────────────────────────────────────────────────
  function dayClass(d) {
    if (!d) return "w-9 h-9";
    const isPast     = d < today;
    const isStart    = startD && d.getTime() === startD.getTime();
    const isEnd      = endD   && d.getTime() === endD.getTime();
    const rangeEnd   = endD || hovered;
    const inRange    = startD && rangeEnd && d > startD && d < rangeEnd;
    const isToday    = d.getTime() === today.getTime();

    if (isPast) {
      return "w-9 h-9 flex items-center justify-center text-sm rounded-full text-gray-300 cursor-not-allowed select-none";
    }

    let base = "w-9 h-9 flex items-center justify-center text-sm rounded-full cursor-pointer select-none transition-colors";

    if (isStart || isEnd) {
      return base + " bg-blue-600 text-white font-bold";
    }
    if (inRange) {
      return "w-9 h-9 flex items-center justify-center text-sm cursor-pointer select-none transition-colors bg-blue-100 text-blue-800 rounded-none";
    }
    if (isToday) {
      return base + " border border-blue-400 text-blue-600 font-semibold hover:bg-blue-50";
    }
    return base + " text-gray-700 hover:bg-gray-100";
  }

  // ── Single month grid ──────────────────────────────────────────────────────
  function MonthGrid({ year, month }) {
    const cells = buildCells(year, month);
    return (
      <div className="flex-1 min-w-[220px]">
        <p className="text-center text-sm font-bold text-blue-600 mb-3">
          {MONTHS[month]} {year}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="w-9 h-8 flex items-center justify-center text-[11px] font-bold text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => (
            <div
              key={i}
              className={dayClass(d)}
              onClick={() => d && handleDay(d)}
              onMouseEnter={() => d && d >= today && setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            >
              {d ? d.getDate() : ""}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full">
      {/* Header: selected range */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          ‹
        </button>

        <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
          <span className={startD ? "text-blue-600 font-bold" : "text-gray-400"}>
            {startD ? fmtShort(startD) : "Start date"}
          </span>
          <span className="text-gray-300">→</span>
          <span className={endD ? "text-blue-600 font-bold" : "text-gray-400"}>
            {endD ? fmtShort(endD) : "End date"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Two-month grid */}
      <div className="flex gap-4">
        <MonthGrid year={viewDate.getFullYear()} month={viewDate.getMonth()} />
        <div className="w-px bg-gray-100 shrink-0" />
        <MonthGrid year={nextMo.getFullYear()} month={nextMo.getMonth()} />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onChange({ dateFrom: "", dateTo: "" })}
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

export default TripDateRangePicker;
