// ─── useTripMembers ────────────────────────────────────────────────────────────
// Lấy danh sách member từ REST API (GET /trips/{id}/members),
// sau đó subscribe tracking realtime từ Firestore subcollection để override.
// Khi Firestore phát hiện member bị xóa khỏi subcollection, tự động re-fetch REST.
// Trả về: { members: [{ uid, username, display_name, avatar_url, joined_at, tracking }], memberUids, loading, error }

import { useState, useEffect, useRef, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { tripService } from "../../../services/backend/trip.service";

/**
 * @param {string|null} tripId
 * @param {number} [refreshKey=0] — tăng giá trị này để force re-fetch REST members
 * @returns {{ members: Array, memberUids: string[], loading: boolean, error: string|null }}
 */
export function useTripMembers(tripId, refreshKey = 0) {
  const [restMembers, setRestMembers] = useState([]); // full member objects từ REST
  const [trackingMap, setTrackingMap] = useState({}); // uid -> { joined_at, tracking } từ Firestore
  const [trackingReady, setTrackingReady] = useState(false); // true sau khi snapshot đầu tiên về
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Giữ ref để detect member bị xóa khỏi Firestore subcollection
  const prevFirestoreUidsRef = useRef(null); // null = chưa có snapshot nào

  // ── Fetch members từ REST API ────────────────────────────────────────────────
  const fetchRestMembers = useCallback((id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    tripService
      .getTripMembers(id)
      .then((members) => {
        console.log("[useTripMembers] fetched members:", members);
        setRestMembers(members);
      })
      .catch((err) => {
        console.error("[useTripMembers] REST fetch error:", err);
        setError(err.message || "Không thể tải danh sách thành viên");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── 1. Fetch lần đầu khi tripId / refreshKey thay đổi ───────────────────────
  useEffect(() => {
    if (!tripId) {
      setRestMembers([]);
      setError(null);
      return;
    }
    prevFirestoreUidsRef.current = null; // reset khi đổi trip
    fetchRestMembers(tripId);
  }, [tripId, refreshKey, fetchRestMembers]);

  // ── 2. Subscribe tracking realtime từ Firestore ──────────────────────────────
  useEffect(() => {
    if (!tripId) {
      setTrackingMap({});
      return;
    }

    const colRef = collection(db, "trips", tripId, "members");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const map = {};
        const currentUids = new Set();
        snap.docs.forEach((doc) => {
          const data = doc.data();
          currentUids.add(doc.id);
          map[doc.id] = {
            joined_at: data.joined_at ?? null,
            tracking: data.tracking ?? null,
          };
        });
        setTrackingMap(map);
        setTrackingReady(true);

        // Nếu đã có snapshot trước đó và số lượng uid giảm → có member bị xóa
        // → re-fetch REST để cập nhật danh sách
        const prev = prevFirestoreUidsRef.current;
        if (prev !== null) {
          const memberLeft = [...prev].some((uid) => !currentUids.has(uid));
          if (memberLeft) {
            console.log("[useTripMembers] member left detected, re-fetching REST...");
            fetchRestMembers(tripId);
          }
        }
        prevFirestoreUidsRef.current = currentUids;
      },
      (err) => {
        console.error("[useTripMembers] Firestore tracking error:", err);
        setTrackingReady(true); // unblock GPS even on error
      }
    );

    return () => { unsub(); setTrackingReady(false); };
  }, [tripId, fetchRestMembers]);

  // ── 3. Merge: Firestore uid là source of truth, REST cung cấp profile info ──
  // Chỉ hiển thị member còn tồn tại trong Firestore subcollection.
  // Profile (tên, avatar) lấy từ restMembers nếu có, fallback về uid.
  const restMemberMap = Object.fromEntries(restMembers.map((m) => [m.uid, m]));

  const members = Object.keys(trackingMap).map((uid) => {
    const rest = restMemberMap[uid];
    return {
      uid,
      username:     rest?.username     ?? null,
      display_name: rest?.display_name ?? null,
      avatar_url:   rest?.avatar_url   ?? null,
      joined_at:    trackingMap[uid]?.joined_at ?? rest?.joined_at ?? null,
      tracking:     trackingMap[uid]?.tracking  ?? rest?.tracking  ?? null,
    };
  });

  const memberUids = members.map((m) => m.uid);

  return { members, memberUids, loading, trackingReady, error };
}
