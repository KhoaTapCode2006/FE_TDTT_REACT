// ─── useGpsTracking ────────────────────────────────────────────────────────────
// Push GPS của user hiện tại lên Firestore cho tất cả trips họ là thành viên.
// Gọi hook này ở TripPage — tracking bắt đầu khi vào trang, dừng khi rời trang.

import { useEffect, useRef, useCallback } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

/**
 * @param {string[]} tripIds - Danh sách trip IDs mà user là thành viên
 * @returns {{ pause: () => void, resume: () => void }}
 */
export function useGpsTracking(tripIds) {
  const watchIdRef  = useRef(null);
  const tripIdsRef  = useRef(tripIds);
  const pausedRef   = useRef(false); // true khi fake GPS đang bật

  // Giữ ref luôn up-to-date khi tripIds thay đổi
  useEffect(() => {
    tripIdsRef.current = tripIds;
  }, [tripIds]);

  const pushToAllTrips = useCallback(async (lat, lng) => {
    // Không push nếu đang bị pause (fake GPS đang chiếm quyền)
    if (pausedRef.current) return;

    const uid = auth.currentUser?.uid;
    if (!uid || !tripIdsRef.current?.length) return;

    const payload = {
      tracking: {
        lat,
        lng,
        updated_at: serverTimestamp(),
        status: "active",
      },
    };

    // Push song song lên tất cả trips
    await Promise.allSettled(
      tripIdsRef.current.map((tripId) =>
        setDoc(doc(db, "trips", tripId, "members", uid), payload, { merge: true })
      )
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Lấy ngay lần đầu khi vào trang
    navigator.geolocation.getCurrentPosition(
      (pos) => pushToAllTrips(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("[useGpsTracking] initial position error:", err.message),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    // Watch liên tục
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pushToAllTrips(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("[useGpsTracking] watch error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      // Dừng tracking khi rời trang
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Đặt status = no_share cho tất cả trips
      const uid2 = auth.currentUser?.uid;
      if (uid2 && tripIdsRef.current?.length) {
        Promise.allSettled(
          tripIdsRef.current.map((tripId) =>
            setDoc(
              doc(db, "trips", tripId, "members", uid2),
              { tracking: { status: "no_share" } },
              { merge: true }
            )
          )
        ).catch(() => {});
      }
    };
  }, [pushToAllTrips]);

  const pause  = useCallback(() => { pausedRef.current = true;  }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  return { pause, resume };
}
