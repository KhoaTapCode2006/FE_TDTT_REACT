import { useState } from "react";
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
  const [clickCount, setClickCount] = useState(() => {
    if (checkIn && checkOut) return 2;
    if (checkIn) return 1;
    return 0;
  });
  const [hovered, setHovered] = useState(null);

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
    if (!d || d < today) return; // Prevent selecting past dates

    console.log('📅 DateRangePicker handleDay:', { 
      selectedDate: d, 
      clickCount, 
      currentCheckIn: checkIn, 
      currentCheckOut: checkOut 
    });

    // Click 1: Set check-in date, clear check-out
    if (clickCount === 0 || (!checkIn && !checkOut)) {
      console.log('📅 Setting check-in:', d);
      onChange({ checkIn: d, checkOut: null });
      setClickCount(1);
      return;
    }

    // Click 2: Set check-out date
    if (clickCount === 1 && checkIn && !checkOut) {
      if (d.getTime() === checkIn.getTime()) {
        // Same date clicked, do nothing
        console.log('📅 Same date clicked, ignoring');
        return;
      } else if (d < checkIn) {
        // If selected date is before check-in, swap them automatically
        console.log('📅 Swapping dates - selected before check-in');
        onChange({ checkIn: d, checkOut: checkIn });
      } else {
        // Normal case: set as check-out
        console.log('📅 Setting check-out:', d);
        onChange({ checkIn, checkOut: d });
      }
      setClickCount(2);
      return;
    }

    // Click 3+: Reset both dates, set clicked date as new check-in
    if (clickCount >= 2 || (checkIn && checkOut)) {
      console.log('📅 Resetting dates, new check-in:', d);
      onChange({ checkIn: d, checkOut: null });
      setClickCount(1);
      return;
    }
  }

  function dayClass(d) {
    if (!d) return "";
    const isDisabled = d < today;
    const isToday = d.getTime() === today.getTime();
    const isStart = checkIn && d.getTime() === checkIn.getTime();
    const isEnd = checkOut && d.getTime() === checkOut.getTime();
    const rangeEnd = checkOut || (clickCount === 1 && checkIn ? hovered : null);
    const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd;
    let cls = "cal-day";
    if (isDisabled) cls += " disabled";
    if (isToday) cls += " today";
    if (isStart) cls += " selected range-start";
    if (isEnd) cls += " selected range-end";
    if (inRange) cls += " in-range";
    return cls;
  }

  function getSelectionStateLabel() {
    if (!checkIn) {
      return "Select check-in date";
    } else if (checkIn && !checkOut) {
      return "Select check-out date";
    }
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

        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-6 text-sm font-semibold text-on-surface-variant">
            <span className={!checkIn ? "text-blue-600 font-bold" : ""}>
              Check-in: {checkIn ? fmtDate(checkIn) : "Select date"}
            </span>
            <span>→</span>
            <span className={checkIn && !checkOut ? "text-blue-600 font-bold" : ""}>
              Check-out: {checkOut ? fmtDate(checkOut) : "Select date"}
            </span>
          </div>
          
          {/* Selection state indicator */}
          <p className="text-xs text-blue-600 italic font-medium">
            {getSelectionStateLabel()}
          </p>
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
          onClick={() => { 
            onChange({ checkIn: null, checkOut: null }); 
            setClickCount(0); // Reset click count
          }}
          className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          Clear
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default DateRangePicker;
