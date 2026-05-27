// ─── usePresence ──────────────────────────────────────────────────────────────
// Ghi trạng thái online/offline của user hiện tại lên Firebase RTDB.
// Path: presence/{uid} = { online: true/false }
// Dùng onDisconnect() để Firebase tự set offline khi mất kết nối.

import { useEffect } from "react";
import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "../../../config/firebase";

/**
 * @param {string|null} uid — uid của user đang đăng nhập
 */
export function usePresence(uid) {
  useEffect(() => {
    if (!uid) return;

    const presenceRef = ref(rtdb, `presence/${uid}`);

    // Set online ngay khi mount
    set(presenceRef, { online: true, last_changed: serverTimestamp() });

    // Firebase tự set offline khi client disconnect (mất mạng, đóng tab, v.v.)
    onDisconnect(presenceRef).set({ online: false, last_changed: serverTimestamp() });

    return () => {
      // Set offline khi component unmount (logout, rời trang)
      set(presenceRef, { online: false, last_changed: serverTimestamp() });
    };
  }, [uid]);
}
