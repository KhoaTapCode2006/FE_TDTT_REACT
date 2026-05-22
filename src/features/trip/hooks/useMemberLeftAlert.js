// ─── useMemberLeftAlert ────────────────────────────────────────────────────────
// Theo dõi danh sách members, phát hiện khi có member rời chuyến đi.
// Trả về danh sách toast notifications để hiển thị.
// Không thông báo cho chính user hiện tại (họ là người rời).

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Phát 1 tiếng ping nhẹ — báo hiệu có member rời chuyến đi.
 * Dùng sine wave 520Hz, fade out mượt ~0.4s.
 */
function playMemberLeftPing() {
  let ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (err) {
    console.warn("[useMemberLeftAlert] Web Audio API not available:", err);
    return;
  }

  const now = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);

  // Attack nhanh, decay mượt
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.6, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc.start(now);
  osc.stop(now + 0.45);

  setTimeout(() => {
    try { ctx.close(); } catch (_) {}
  }, 700);
}

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
        playMemberLeftPing();

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
