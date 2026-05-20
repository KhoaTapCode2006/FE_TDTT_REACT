// ─── useGpsTracking ────────────────────────────────────────────────────────────
// Push GPS của user hiện tại lên Firestore cho tất cả trips họ là thành viên.
// Gọi hook này ở TripPage — tracking bắt đầu khi vào trang, dừng khi rời trang.

import { useEffect, useRef, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { trackingState } from "../../../services/trip/trackingState";

/**
 * @param {string[]} tripIds - Danh sách trip IDs mà user là thành viên
 * @returns {{ pause: () => void, resume: () => void, stopSharing: (tripId?: string) => Promise<void> }}
 */
export function useGpsTracking(tripIds) {
  const watchIdRef  = useRef(null);
  const tripIdsRef  = useRef(tripIds);
  const pausedRef   = useRef(false); // true khi fake GPS đang bật
  const stoppedRef  = useRef(false); // true khi user chủ động ngưng chia sẻ
  const uidRef      = useRef(auth.currentUser?.uid ?? null); // lưu uid lúc mount, tránh mất khi logout

  // Giữ ref luôn up-to-date khi tripIds thay đổi
  useEffect(() => {
    tripIdsRef.current = tripIds;
  }, [tripIds]);

  // Cập nhật uidRef khi auth thay đổi
  useEffect(() => {
    uidRef.current = auth.currentUser?.uid ?? null;
  });

  const pushToAllTrips = useCallback(async (lat, lng) => {
    // Không push nếu đang bị pause, đã stop, hoặc user đã logout
    if (pausedRef.current || stoppedRef.current || trackingState.isLoggedOut()) {
      return;
    }

    const uid = uidRef.current;
    if (!uid || !tripIdsRef.current?.length) return;

    console.log("[useGpsTracking] pushToAllTrips lat:", lat, "lng:", lng);
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

    // Lưu uid vào ref ngay khi bắt đầu tracking
    uidRef.current = uid;

    // Reset stopped state khi mount lại
    stoppedRef.current = false;

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

      // Set no_share khi rời trang — không xóa lat/lng vì Firestore rules yêu cầu chúng là number
      const uid2 = uidRef.current;
      if (uid2 && tripIdsRef.current?.length) {
        Promise.allSettled(
          tripIdsRef.current.map((tripId) =>
            updateDoc(doc(db, "trips", tripId, "members", uid2), {
              "tracking.status":     "no_share",
              "tracking.updated_at": serverTimestamp(),
            })
          )
        ).catch(() => {});
      }
    };
  }, [pushToAllTrips]);

  const pause  = useCallback(() => { pausedRef.current = true;  }, []);
  const resume = useCallback(() => {
    pausedRef.current = false;
    stoppedRef.current = false;
  }, []);

  /**
   * Dừng hẳn GPS thực + xóa lat/lng trên Firestore cho một trip cụ thể (hoặc tất cả).
   * Dùng khi user nhấn "Ngưng chia sẻ" trong FakeGpsControl.
   */
  const stopSharing = useCallback(async (specificTripId) => {
    // Set stopped TRƯỚC để block bất kỳ push nào đang pending
    console.log("[useGpsTracking] stopSharing called, setting stoppedRef=true");
    stoppedRef.current = true;

    // Clear watch ngay lập tức để không có callback nào được gọi thêm
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log("[useGpsTracking] watchPosition cleared");
    }

    const uid = uidRef.current;
    if (!uid) return;

    const targets = specificTripId ? [specificTripId] : (tripIdsRef.current ?? []);
    if (!targets.length) return;

    await Promise.allSettled(
      targets.map(async (tripId) => {
        try {
          await updateDoc(doc(db, "trips", tripId, "members", uid), {
            // Không xóa lat/lng vì Firestore rules yêu cầu chúng là number
            "tracking.status":     "no_share",
            "tracking.updated_at": serverTimestamp(),
          });
          console.log("[useGpsTracking] stopSharing updateDoc SUCCESS for trip:", tripId);
        } catch (err) {
          console.error("[useGpsTracking] stopSharing updateDoc FAILED:", err);
          try {
            await setDoc(doc(db, "trips", tripId, "members", uid), {
              tracking: { status: "no_share", updated_at: serverTimestamp() },
            }, { merge: true });
            console.log("[useGpsTracking] stopSharing setDoc fallback SUCCESS");
          } catch (err2) {
            console.error("[useGpsTracking] stopSharing setDoc fallback FAILED:", err2);
          }
        }
      })
    );
  }, []);

  return { pause, resume, stopSharing };
}
