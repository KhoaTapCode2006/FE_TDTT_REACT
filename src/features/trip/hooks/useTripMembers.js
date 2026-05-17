// ─── useTripMembers ────────────────────────────────────────────────────────────
// Lấy danh sách member UIDs từ REST API (GET /trips/{id}/members),
// sau đó subscribe tracking realtime từ Firestore subcollection.
// Trả về: { members: [{ uid, joined_at, tracking }], memberUids, loading, error }

import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { tripService } from "../../../services/backend/trip.service";

/**
 * @param {string|null} tripId
 * @returns {{ members: Array, memberUids: string[], loading: boolean, error: string|null }}
 */
export function useTripMembers(tripId) {
  const [memberUids, setMemberUids] = useState([]);
  const [trackingMap, setTrackingMap] = useState({}); // uid -> { joined_at, tracking }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── 1. Fetch member UIDs từ REST API ────────────────────────────────────────
  useEffect(() => {
    if (!tripId) {
      setMemberUids([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    tripService
      .getTripMembers(tripId)
      .then((uids) => {
        if (!cancelled) {
          setMemberUids(uids);
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
  }, [tripId]);

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
        // Không set error ở đây — tracking là optional, không block UI
      }
    );

    return () => unsub();
  }, [tripId]);

  // ── 3. Merge UIDs + tracking ─────────────────────────────────────────────────
  const members = memberUids.map((uid) => ({
    uid,
    joined_at: trackingMap[uid]?.joined_at ?? null,
    tracking: trackingMap[uid]?.tracking ?? null,
  }));

  return { members, memberUids, loading, error };
}
