// ─── useTripMembers ────────────────────────────────────────────────────────────
// Lấy danh sách member từ REST API (GET /trips/{id}/members),
// sau đó subscribe tracking realtime từ Firestore subcollection để override.
// Trả về: { members: [{ uid, username, display_name, avatar_url, joined_at, tracking }], memberUids, loading, error }

import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── 1. Fetch members từ REST API ─────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) {
      setRestMembers([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    tripService
      .getTripMembers(tripId)
      .then((members) => {
        if (!cancelled) {
          console.log("[useTripMembers] fetched members:", members);
          setRestMembers(members);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[useTripMembers] REST fetch error:", err);
          setError(err.message || "Không thể tải danh sách thành viên");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  // ── 2. Subscribe tracking realtime từ Firestore (override tracking từ REST) ──
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
        snap.docs.forEach((doc) => {
          const data = doc.data();
          map[doc.id] = {
            joined_at: data.joined_at ?? null,
            tracking: data.tracking ?? null,
          };
        });
        setTrackingMap(map);
      },
      (err) => {
        console.error("[useTripMembers] Firestore tracking error:", err);
        // Tracking là optional, không block UI
      }
    );

    return () => unsub();
  }, [tripId]);

  // ── 3. Merge REST members + Firestore tracking (Firestore override REST tracking) ──
  const members = restMembers.map((m) => ({
    uid: m.uid,
    username: m.username ?? null,
    display_name: m.display_name ?? null,
    avatar_url: m.avatar_url ?? null,
    joined_at: trackingMap[m.uid]?.joined_at ?? m.joined_at ?? null,
    tracking: trackingMap[m.uid]?.tracking ?? m.tracking ?? null,
  }));

  const memberUids = members.map((m) => m.uid);

  return { members, memberUids, loading, error };
}
