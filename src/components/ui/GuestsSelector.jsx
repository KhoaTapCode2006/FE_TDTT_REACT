import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

function GuestsSelector({ guests, onChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  function changeAdults(delta) {
    onChange({ ...guests, adults: Math.max(1, guests.adults + delta) });
  }

  function changeChildren(delta) {
    const next = Math.max(0, guests.children + delta);
    const ages = [...guests.childrenAges];
    if (next > guests.children) ages.push(0);
    else ages.pop();
    onChange({ ...guests, children: next, childrenAges: ages });
  }

  function changeChildAge(index, age) {
    const ages = [...guests.childrenAges];
    ages[index] = Number(age);
    onChange({ ...guests, childrenAges: ages });
  }

  function Counter({ label, value, onDec, onInc, min = 0 }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
        <span className="text-sm font-semibold text-on-surface">{label}</span>
        <div className="flex items-center gap-3">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDec(); }}
            disabled={value <= min}
            className="w-8 h-8 rounded-full border-2 border-outline-variant/40 flex items-center justify-center text-primary font-bold hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="remove" size={16} />
          </button>
          <span className="w-5 text-center text-sm font-bold text-on-surface">{value}</span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onInc(); }}
            className="w-8 h-8 rounded-full border-2 border-primary bg-primary flex items-center justify-center text-white font-bold hover:bg-primary-container transition-colors"
          >
            <Icon name="add" size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="modal-anim absolute top-full right-0 mt-2 z-[500] bg-white rounded-2xl shadow-2xl p-5 border border-outline-variant/20"
      style={{ minWidth: 300 }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Số khách</p>

      <Counter
        label="Người lớn"
        value={guests.adults}
        min={1}
        onDec={() => changeAdults(-1)}
        onInc={() => changeAdults(1)}
      />
      <Counter
        label="Trẻ em"
        value={guests.children}
        min={0}
        onDec={() => changeChildren(-1)}
        onInc={() => changeChildren(1)}
      />

      {guests.children > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Tuổi trẻ em</p>
          {guests.childrenAges.map((age, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm text-on-surface-variant">Bé {i + 1}</span>
              <select
                value={age}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); changeChildAge(i, e.target.value); }}
                className="border border-outline-variant/40 rounded-xl pl-3 pr-8 py-1.5 text-sm font-medium text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                {Array.from({ length: 13 }, (_, v) => (
                  <option key={v} value={v}>{v} tuổi</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container transition-colors"
      >
        Xác nhận
      </button>
    </div>
  );
}

export default GuestsSelector;
