import { useState, useRef, useEffect, useCallback } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

// 5 mét mỗi lần nhấn
const METER_TO_DEG_LAT = 5 / 111320;

function meterToLng(lat) {
  return 5 / (111320 * Math.cos((lat * Math.PI) / 180));
}

export default function FakeGpsControl({ tripId, initialLat, initialLng, onActivate, onStop }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
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
    console.log("[FakeGPS] pushFakePos uid:", uid, "tripId:", tripId, "pos:", lat, lng);
    if (!uid || !tripId) return;
    try {
      await setDoc(
        doc(db, "trips", tripId, "members", uid),
        { tracking: { lat, lng, updated_at: serverTimestamp(), status: "active" } },
        { merge: true }
      );
      console.log("[FakeGPS] Firestore write OK");
    } catch (err) {
      console.warn("[FakeGpsControl] push failed:", err);
    }
  }, [tripId]);

  const move = useCallback((direction) => {
    const { lat, lng } = posRef.current;
    const dLat = METER_TO_DEG_LAT;
    const dLng = meterToLng(lat);

    let newLat = lat;
    let newLng = lng;

    switch (direction) {
      case "up":    newLat = lat + dLat; break;
      case "down":  newLat = lat - dLat; break;
      case "right": newLng = lng + dLng; break;
      case "left":  newLng = lng - dLng; break;
    }

    posRef.current = { lat: newLat, lng: newLng };
    console.log("[FakeGPS] move", direction, "→", newLat, newLng, "tripId:", tripId);
    pushFakePos(newLat, newLng);
  }, [pushFakePos]);

  const handleActivate = () => {
    setActive(true);
    setOpen(true);
    onActivate?.();
    // Push ngay vị trí hiện tại để bắt đầu fake session
    pushFakePos(posRef.current.lat, posRef.current.lng);
  };

  const handleStop = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (uid && tripId) {
      try {
        await setDoc(
          doc(db, "trips", tripId, "members", uid),
          { tracking: { status: "no_share", updated_at: serverTimestamp() } },
          { merge: true }
        );
      } catch (err) {
        console.warn("[FakeGpsControl] stop failed:", err);
      }
    }
    setActive(false);
    setOpen(false);
    onStop?.();
  }, [tripId, onStop]);

  return (
    <div className="absolute bottom-14 right-4 z-[999] flex flex-col items-end gap-2 pointer-events-auto">

      {/* Control panel — hiện khi active */}
      {open && active && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-3 flex flex-col items-center gap-2 select-none">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
            GPS ảo — 5m/bước
          </span>

          <button
            onClick={() => { console.log("[FakeGPS] UP clicked"); move("up"); }}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-gray-700 font-bold text-lg transition-all"
            title="Di chuyển lên (Bắc)"
          >↑</button>

          <div className="flex gap-2">
            <button
              onClick={() => { console.log("[FakeGPS] LEFT clicked"); move("left"); }}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-gray-700 font-bold text-lg transition-all"
              title="Di chuyển trái (Tây)"
            >←</button>
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">📍</span>
            </div>
            <button
              onClick={() => { console.log("[FakeGPS] RIGHT clicked"); move("right"); }}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-gray-700 font-bold text-lg transition-all"
              title="Di chuyển phải (Đông)"
            >→</button>
          </div>

          <button
            onClick={() => { console.log("[FakeGPS] DOWN clicked"); move("down"); }}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-gray-700 font-bold text-lg transition-all"
            title="Di chuyển xuống (Nam)"
          >↓</button>

          <button
            onClick={handleStop}
            className="mt-1 w-full px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold transition-all"
          >
            Ngưng chia sẻ
          </button>
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
