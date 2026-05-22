// ─── useMemberLeftAlert ────────────────────────────────────────────────────────
// Theo dõi danh sách members, phát hiện khi có member rời chuyến đi.
// Trả về danh sách toast notifications để hiển thị.
// Không thông báo cho chính user hiện tại (họ là người rời).

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * @param {Array}  members    - danh sách members từ useTripMembers
 * @param {string} currentUid - UID của user hiện tại
 * @returns {{ toasts: Array, dismissToast: (id) => void }}
 */
export function useMemberLeftAlert(members, currentUid) {
  const [toasts, setToasts] = useState([]); // [{ id, name }]
  const prevMembersRef = useRef(null); // Map<uid, { display_name, username }>

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const prev = prevMembersRef.current;

    if (prev !== null) {
      // Tìm uid có trong prev nhưng không còn trong members hiện tại
      const currentUids = new Set(members.map((m) => m.uid));
      const leftMembers = [...prev.entries()]
        .filter(([uid]) => uid !== currentUid && !currentUids.has(uid))
        .map(([, info]) => info);

      if (leftMembers.length > 0) {
        const newToasts = leftMembers.map((info) => ({
          id: `${Date.now()}-${Math.random()}`,
          name: info.display_name ?? info.username ?? "Thành viên",
        }));
        setToasts((prev) => [...prev, ...newToasts]);

        // Tự động dismiss sau 4 giây
        newToasts.forEach((t) => {
          setTimeout(() => dismissToast(t.id), 4000);
        });
      }
    }

    // Cập nhật snapshot
    const next = new Map();
    members.forEach((m) => {
      next.set(m.uid, {
        display_name: m.display_name ?? null,
        username: m.username ?? null,
      });
    });
    prevMembersRef.current = next;
  }, [members, currentUid, dismissToast]);

  return { toasts, dismissToast };
}
