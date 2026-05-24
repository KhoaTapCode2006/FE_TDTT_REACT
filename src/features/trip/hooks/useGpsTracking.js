// ─── useGpsTracking ────────────────────────────────────────────────────────────
// Push GPS của user hiện tại lên Firestore cho tất cả trips họ là thành viên.
// Gọi hook này ở TripPage — tracking bắt đầu khi vào trang, dừng khi rời trang.

import { useEffect, useRef, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { trackingState } from "../../../services/trip/trackingState";

const PUSH_INTERVAL_MS = 5_000;
const GPS_TIMEOUT_MS   = 10_000;

/**
 * @param {string[]} tripIds - Danh sách trip IDs mà user là thành viên
 * @returns {{ pause: () => void, resume: () => void }}
 */
export function useGpsTracking(tripIds) {
  const intervalRef = useRef(null);
  const watchIdRef  = useRef(null);   // watchPosition ID — dùng để cache vị trí mới nhất
  const tripIdsRef  = useRef(tripIds);
  const pausedRef   = useRef(false);  // true khi fake GPS đang bật
  const uidRef      = useRef(null);
  const lastPosRef  = useRef(null);   // { lat, lng } — vị trí mới nhất từ watchPosition

  // Luôn giữ tripIdsRef cập nhật
  useEffect(() => {
    tripIdsRef.current = tripIds;
  }, [tripIds]);

  const pushToAllTrips = useCallback(async (lat, lng) => {
    if (pausedRef.current || trackingState.isLoggedOut()) return;

    const uid = uidRef.current;
    if (!uid || !tripIdsRef.current?.length) return;

    console.log("[useGpsTracking] push lat:", lat, "lng:", lng);
    const payload = {
      tracking: { lat, lng, updated_at: serverTimestamp(), status: "active" },
    };

    await Promise.allSettled(
      tripIdsRef.current.map((tripId) =>
        setDoc(doc(db, "trips", tripId, "members", uid), payload, { merge: true })
      )
    );
  }, []);

  const pushToAllTripsRef = useRef(pushToAllTrips);
  useEffect(() => { pushToAllTripsRef.current = pushToAllTrips; }, [pushToAllTrips]);

  // Khởi động interval + watchPosition sau khi có uid
  const startTracking = useCallback((uid) => {
    if (!navigator.geolocation) return;
    if (intervalRef.current) return; // đã chạy rồi

    uidRef.current = uid;

    // watchPosition để cache vị trí mới nhất liên tục
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      (err) => console.warn("[useGpsTracking] watchPosition error:", err.message),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 5_000 }
    );

    // Push ngay lần đầu
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        lastPosRef.current = { lat, lng };
        pushToAllTripsRef.current(lat, lng);
      },
      (err) => console.warn("[useGpsTracking] initial position error:", err.message),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 }
    );

    // Interval: ưu tiên dùng vị trí đã cache từ watchPosition,
    // fallback sang getCurrentPosition nếu chưa có cache
    intervalRef.current = setInterval(() => {
      if (pausedRef.current || trackingState.isLoggedOut()) return;

      if (lastPosRef.current) {
        // Có cache → push ngay, không cần gọi GPS lại
        pushToAllTripsRef.current(lastPosRef.current.lat, lastPosRef.current.lng);
      } else {
        // Chưa có cache → fallback getCurrentPosition
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            lastPosRef.current = { lat, lng };
            pushToAllTripsRef.current(lat, lng);
          },
          (err) => console.warn("[useGpsTracking] interval fallback error:", err.message),
          { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 5_000 }
        );
      }
    }, PUSH_INTERVAL_MS);
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastPosRef.current = null;
  }, []);

  // Lắng nghe auth state để xử lý trường hợp uid chưa sẵn sàng khi mount
  useEffect(() => {
    // Nếu auth đã có uid ngay → start luôn
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      startTracking(currentUid);
    }

    // Lắng nghe thay đổi auth (trường hợp uid load async)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid && !intervalRef.current) {
        startTracking(user.uid);
      } else if (!user) {
        stopTracking();
        uidRef.current = null;
      }
    });

    return () => {
      unsubscribe();
      stopTracking();

      // Set no_share khi rời trang
      const uid = uidRef.current;
      if (uid && tripIdsRef.current?.length && !trackingState.isLoggedOut()) {
        Promise.allSettled(
          tripIdsRef.current.map((tripId) =>
            updateDoc(doc(db, "trips", tripId, "members", uid), {
              "tracking.status":     "no_share",
              "tracking.updated_at": serverTimestamp(),
            })
          )
        ).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ mount/unmount

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    // Nếu interval bị stop (ví dụ do lỗi), restart lại
    if (!intervalRef.current && uidRef.current) {
      startTracking(uidRef.current);
    }
  }, [startTracking]);

  return { pause, resume };
}
