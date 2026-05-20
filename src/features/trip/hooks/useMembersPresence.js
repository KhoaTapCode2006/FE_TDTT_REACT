// ─── useMembersPresence ────────────────────────────────────────────────────────
// Subscribe realtime presence của nhiều uid từ Firebase RTDB.
// Trả về: Map<uid, boolean> — true = online, false/undefined = offline

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../../config/firebase";

/**
 * @param {string[]} uids — danh sách uid cần theo dõi
 * @returns {Record<string, boolean>} presenceMap — uid -> online (true/false)
 */
export function useMembersPresence(uids = []) {
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!uids.length) {
      setPresenceMap({});
      return;
    }

    const unsubs = uids.map((uid) => {
      const presenceRef = ref(rtdb, `presence/${uid}`);
      return onValue(presenceRef, (snap) => {
        const data = snap.val();
        setPresenceMap((prev) => ({
          ...prev,
          [uid]: data?.online === true,
        }));
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uids.join(",")]);

  return presenceMap;
}
