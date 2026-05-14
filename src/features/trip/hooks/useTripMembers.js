// ─── useTripMembers ────────────────────────────────────────────────────────────
// Subscribe realtime danh sách members của một trip từ Firestore.
// Trả về: { members: [{ uid, joined_at, tracking }], loading, error }

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * @param {string|null} tripId
 * @returns {{ members: Array, memberUids: string[], loading: boolean, error: string|null }}
 */
export function useTripMembers(tripId) {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!tripId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    const colRef = collection(db, "trips", tripId, "members");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            uid:       doc.id,
            joined_at: data.joined_at ?? null,
            tracking:  data.tracking  ?? null,
          };
        });
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        console.error("[useTripMembers] onSnapshot error:", err);
        setError(err.message || "Không thể tải danh sách thành viên");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [tripId]);

  const memberUids = members.map((m) => m.uid);

  return { members, memberUids, loading, error };
}
