// ─── useRouteChangeAlert ───────────────────────────────────────────────────────
// Theo dõi danh sách members, phát âm thanh "Mario coin" khi có member mới
// chuyển sang trạng thái change_route.
// Không phát âm cho chính user hiện tại.

import { useEffect, useRef } from "react";

/**
 * Phát âm thanh Mario coin bằng Web Audio API.
 * Hai note: B5 (988Hz) → E6 (1319Hz), mỗi note ~0.1s.
 */
function playMarioCoin() {
  let ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (err) {
    console.warn("[useRouteChangeAlert] Web Audio API not available:", err);
    return;
  }

  const now = ctx.currentTime;

  const note = (startTime, freq, duration) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, startTime);

    // Attack nhanh, decay nhẹ
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.setValueAtTime(0.3, startTime + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  // Mario coin: B5 → E6
  note(now,        988,  0.1);
  note(now + 0.1, 1319,  0.15);

  setTimeout(() => {
    try { ctx.close(); } catch (_) {}
  }, 500);
}

/**
 * @param {Array}  members    - danh sách members từ useTripMembers (có tracking.status)
 * @param {string} currentUid - UID của user hiện tại (không alert cho chính họ)
 */
export function useRouteChangeAlert(members, currentUid) {
  const prevStatusRef = useRef({}); // uid -> status trước đó

  useEffect(() => {
    const prev = prevStatusRef.current;

    // Tìm member mới vừa chuyển sang change_route (không phải mình)
    const hasNewRouteChange = members.some((m) => {
      if (m.uid === currentUid) return false;
      const wasChange = prev[m.uid] === "change_route";
      const isChange  = m.tracking?.status === "change_route";
      return !wasChange && isChange;
    });

    if (hasNewRouteChange) {
      playMarioCoin();
    }

    // Cập nhật snapshot
    const next = {};
    members.forEach((m) => {
      next[m.uid] = m.tracking?.status ?? "no_share";
    });
    prevStatusRef.current = next;
  }, [members, currentUid]);
}
