import { useState, useRef, useEffect, useCallback } from "react";
import { doc, setDoc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

// step mặc định 5 mét
const DEFAULT_STEP = 5;

function meterToLatDeg(meters) {
  return meters / 111320;
}

function meterToLngDeg(meters, lat) {
  return meters / (111320 * Math.cos((lat * Math.PI) / 180));
}

export default function FakeGpsControl({ tripId, initialLat, initialLng, onActivate, onStop, onStopSharing, onPositionChange }) {
  const [open, setOpen]   = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep]   = useState(DEFAULT_STEP);
  const posRef = useRef({ lat: initialLat ?? 10.7626, lng: initialLng ?? 106.6822 });

  // Khi chưa active: luôn sync posRef theo vị trí GPS thực mới nhất
  // Khi đã active: posRef do người dùng điều khiển, không sync nữa
  useEffect(() => {
    if (!active && initialLat != null && initialLng != null) {
      posRef.current = { lat: initialLat, lng: initialLng };
    }
  }, [active, initialLat, initialLng]);

  const pushFakePos = useCallback(async (lat, lng) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !tripId) return;
    try {
      await setDoc(
        doc(db, "trips", tripId, "members", uid),
        { tracking: { lat, lng, updated_at: serverTimestamp(), status: "active" } },
        { merge: true }
      );
    } catch (err) {
      console.warn("[FakeGpsControl] push failed:", err);
    }
  }, [tripId]);

  const move = useCallback((direction) => {
    const { lat, lng } = posRef.current;
    const dLat = meterToLatDeg(step);
    const dLng = meterToLngDeg(step, lat);

    let newLat = lat;
    let newLng = lng;

    switch (direction) {
      case "up":    newLat = lat + dLat; break;
      case "down":  newLat = lat - dLat; break;
      case "right": newLng = lng + dLng; break;
      case "left":  newLng = lng - dLng; break;
    }

    posRef.current = { lat: newLat, lng: newLng };
    pushFakePos(newLat, newLng);
    onPositionChange?.(newLat, newLng);
  }, [pushFakePos, step, onPositionChange]);

  const handleActivate = () => {
    setActive(true);
    setOpen(true);
    onActivate?.();
    // Push ngay vị trí hiện tại để bắt đầu fake session
    pushFakePos(posRef.current.lat, posRef.current.lng);
    onPositionChange?.(posRef.current.lat, posRef.current.lng);
  };

  const handleLostSignal = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !tripId) return;
    try {
      await updateDoc(
        doc(db, "trips", tripId, "members", uid),
        {
          "tracking.status":     "lost_signal",
          "tracking.updated_at": serverTimestamp(),
        }
      );
    } catch (err) {
      console.warn("[FakeGpsControl] lost_signal failed:", err);
    }
  }, [tripId]);

  const handleStop = useCallback(async () => {
    // Dùng onStopSharing từ useGpsTracking để đảm bảo GPS thực không ghi đè
    if (onStopSharing) {
      await onStopSharing(tripId);
    } else {
      // Fallback nếu không có onStopSharing
      const uid = auth.currentUser?.uid;
      if (uid && tripId) {
        try {
          await updateDoc(
            doc(db, "trips", tripId, "members", uid),
            {
              "tracking.status":     "no_share",
              "tracking.lat":        deleteField(),
              "tracking.lng":        deleteField(),
              "tracking.updated_at": serverTimestamp(),
            }
          );
        } catch (err) {
          console.warn("[FakeGpsControl] stop failed:", err);
        }
      }
    }
    setActive(false);
    setOpen(false);
    onStop?.();
  }, [tripId, onStop, onStopSharing]);

  return (
    <div className="absolute bottom-14 right-4 z-[999] flex flex-col items-end gap-2 pointer-events-auto">

      {/* Control panel — hiện khi active */}
      {open && active && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-3 flex flex-col items-center gap-2 select-none">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
            GPS ảo — {step}m/bước
          </span>

          {/* Slider tốc độ bước */}
          <div className="w-full flex flex-col gap-1 px-1">
            <input
              type="range"
              min={1}
              max={100}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="w-full h-1.5 accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-medium">
              <span>1m</span>
              <span>100m</span>
            </div>
          </div>

          {/* D-pad kiểu PlayStation — 4 nút rời nhau */}
          <div className="grid grid-cols-3 grid-rows-3 gap-px w-32 h-32">
            {/* Hàng 1 */}
            <div />
            <button
              onClick={() => move("up")}
              title="Bắc"
              className="bg-gray-800 hover:bg-gray-600 active:bg-gray-900 active:scale-95 transition-all"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)", borderRadius: "8px 8px 0 0" }}
            />
            <div />

            {/* Hàng 2 */}
            <button
              onClick={() => move("left")}
              title="Tây"
              className="bg-gray-800 hover:bg-gray-600 active:bg-gray-900 active:scale-95 transition-all"
              style={{ clipPath: "polygon(0 0, 55% 0, 100% 50%, 55% 100%, 0 100%)", borderRadius: "8px 0 0 8px" }}
            />
            <div />
            <button
              onClick={() => move("right")}
              title="Đông"
              className="bg-gray-800 hover:bg-gray-600 active:bg-gray-900 active:scale-95 transition-all"
              style={{ clipPath: "polygon(45% 0, 100% 0, 100% 100%, 45% 100%, 0 50%)", borderRadius: "0 8px 8px 0" }}
            />

            {/* Hàng 3 */}
            <div />
            <button
              onClick={() => move("down")}
              title="Nam"
              className="bg-gray-800 hover:bg-gray-600 active:bg-gray-900 active:scale-95 transition-all"
              style={{ clipPath: "polygon(0 45%, 50% 0, 100% 45%, 100% 100%, 0 100%)", borderRadius: "0 0 8px 8px" }}
            />
            <div />
          </div>

          <div className="mt-1 w-full flex gap-1.5">
            <button
              onClick={handleLostSignal}
              className="flex-1 px-2 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white text-xs font-bold transition-all"
              title="Ghi trạng thái mất tín hiệu"
            >
              Mất tín hiệu
            </button>
            <button
              onClick={handleStop}
              className="flex-1 px-2 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold transition-all"
            >
              Ngưng chia sẻ
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      {!active ? (
        <button
          onClick={handleActivate}
          className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg flex items-center justify-center text-white text-lg transition-all"
          title="Bật GPS ảo"
        >🕹️</button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg flex items-center justify-center text-white text-lg transition-all ring-2 ring-orange-300"
          title={open ? "Ẩn điều khiển" : "Hiện điều khiển"}
        >🕹️</button>
      )}
    </div>
  );
}
