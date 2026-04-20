import { useEffect, useRef, useState } from "react";
import { fmtDate } from "@/utils/format";
import Icon from "@/components/ui/Icon";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function DateRangePicker({ checkIn, checkOut, onChange, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const selectingRef = useRef(checkIn ? "out" : "in");
  const [selecting, setSelectingState] = useState(checkIn ? "out" : "in");
  const [hovered, setHovered] = useState(null);

  function setSelecting(v) {
    selectingRef.current = v;
    setSelectingState(v);
  }

  function buildCalendar(year, month) {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  function handleDay(d, e) {
    if (e) e.stopPropagation();
    if (!d || d < today) return;

    if (!checkIn) {
      onChange({ checkIn: d, checkOut: null });
      return;
    }

    if (checkIn && !checkOut) {
      if (d < checkIn) {
        onChange({ checkIn: d, checkOut: null });
      } else if (d > checkIn) {
        onChange({ checkIn, checkOut: d });
      }
      return;
    }

    if (checkIn && checkOut) {
      if (d < checkIn) {
        onChange({ checkIn: d, checkOut });
      } else if (d > checkOut) {
        onChange({ checkIn, checkOut: d });
      } else if (d > checkIn && d < checkOut) {
        const diffToCheckIn = d.getTime() - checkIn.getTime();
        const diffToCheckOut = checkOut.getTime() - d.getTime();

        if (diffToCheckIn < diffToCheckOut) {
          onChange({ checkIn: d, checkOut });
        } else {
          onChange({ checkIn, checkOut: d });
        }
      }
    }
  }

  function dayClass(d) {
    if (!d) return "";
    const isDisabled = d < today;
    const isToday = d.getTime() === today.getTime();
    const isStart = checkIn && d.getTime() === checkIn.getTime();
    const isEnd = checkOut && d.getTime() === checkOut.getTime();
    const rangeEnd = checkOut || (selecting === "out" ? hovered : null);
    const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd;
    let cls = "cal-day";
    if (isDisabled) cls += " disabled";
    if (isToday) cls += " today";
    if (isStart) cls += " selected range-start";
    if (isEnd) cls += " selected range-end";
    if (inRange) cls += " in-range";
    return cls;
  }

  const cells = buildCalendar(viewDate.getFullYear(), viewDate.getMonth());
  const nextMo = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  const cells2 = buildCalendar(nextMo.getFullYear(), nextMo.getMonth());

  function CalMonth({ year, month, cells }) {
    return (
      <div className="flex-1 min-w-[260px]">
        <p className="text-center font-headline font-bold text-primary mb-3">
          {MONTHS[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="cal-day text-[11px] font-bold text-on-surface-variant">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => (
            <div
              key={i}
              className={dayClass(d)}
              onClick={(e) => { e.stopPropagation(); handleDay(d, e); }}
              onMouseEnter={() => d && setHovered(d)}
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
    <div
      className="modal-anim absolute top-full left-0 mt-2 z-[500] bg-white rounded-2xl shadow-2xl p-5 border border-outline-variant/20"
      style={{ minWidth: 560 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <Icon name="chevron_left" />
        </button>

        <div className="flex gap-6 text-sm font-semibold text-on-surface-variant">
          <span className={selecting === "in" ? "text-primary font-bold" : ""}>
            Check-in: {checkIn ? fmtDate(checkIn) : "Select date"}
          </span>
          <span>→</span>
          <span className={selecting === "out" ? "text-primary font-bold" : ""}>
            Check-out: {checkOut ? fmtDate(checkOut) : "Select date"}
          </span>
        </div>

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <Icon name="chevron_right" />
        </button>
      </div>

      <div className="flex gap-6">
        <CalMonth year={viewDate.getFullYear()} month={viewDate.getMonth()} cells={cells} />
        <div className="w-px bg-outline-variant/20" />
        <CalMonth year={nextMo.getFullYear()} month={nextMo.getMonth()} cells={cells2} />
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { onChange({ checkIn: null, checkOut: null }); setSelecting("in"); }}
          className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Clear
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default DateRangePicker;
