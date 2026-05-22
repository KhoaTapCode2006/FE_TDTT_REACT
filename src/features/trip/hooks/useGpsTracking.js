// ─── useGpsTracking ────────────────────────────────────────────────────────────
// Push GPS của user hiện tại lên Firestore cho tất cả trips họ là thành viên.
// Gọi hook này ở TripPage — tracking bắt đầu khi vào trang, dừng khi rời trang.

import { useEffect, useRef, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { trackingState } from "../../../services/trip/trackingState";

/**
 * @param {string[]} tripIds - Danh sách trip IDs mà user là thành viên
 * @returns {{ pause: () => void, resume: () => void }}
 */
export function useGpsTracking(tripIds) {
  const watchIdRef  = useRef(null);
  const tripIdsRef  = useRef(tripIds);
  const pausedRef   = useRef(false); // true khi fake GPS đang bật
  const stoppedRef  = useRef(false);
  const uidRef      = useRef(auth.currentUser?.uid ?? null);

  useEffect(() => {
    tripIdsRef.current = tripIds;
  }, [tripIds]);

  useEffect(() => {
    uidRef.current = auth.currentUser?.uid ?? null;
  });

  const pushToAllTrips = useCallback(async (lat, lng) => {
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

    uidRef.current = uid;
    stoppedRef.current = false;

    const fetchAndPush = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushToAllTrips(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn("[useGpsTracking] position error:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Push ngay lần đầu khi mount
    fetchAndPush();

    // Sau đó cứ 30 giây push một lần
    watchIdRef.current = setInterval(fetchAndPush, 30_000);

    return () => {
      if (watchIdRef.current != null) {
        clearInterval(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Set no_share khi rời trang
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

  return { pause, resume };
}
