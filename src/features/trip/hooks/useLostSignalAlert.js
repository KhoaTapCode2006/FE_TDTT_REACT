// ─── useLostSignalAlert ────────────────────────────────────────────────────────
// Theo dõi danh sách members, phát một tiếng ping khi có member mới chuyển sang
// trạng thái lost_signal.
// Không phát âm cho chính user hiện tại (họ là người bị mất tín hiệu).

import { useEffect, useRef } from "react";

/**
 * Phát 2 tiếng beep ngắn — báo hiệu có member mất tín hiệu.
 * Dùng Web Audio API, không cần file âm thanh.
 */
function playLostSignalPing() {
  let ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (err) {
    console.warn("[useLostSignalAlert] Web Audio API not available:", err);
    return;
  }

  const now = ctx.currentTime;

  const beep = (startTime, freq) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.setValueAtTime(0.3, startTime + 0.12);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.15);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  };

  // 2 tiếng beep liên tiếp
  beep(now,        660);
  beep(now + 0.22, 660);

  // Đóng context sau khi âm thanh kết thúc
  setTimeout(() => {
    try { ctx.close(); } catch (_) {}
  }, 600);
}

/**
 * @param {Array}  members    - danh sách members từ useTripMembers (có tracking.status)
 * @param {string} currentUid - UID của user hiện tại (không alert cho chính họ)
 */
export function useLostSignalAlert(members, currentUid) {
  const prevStatusRef = useRef({}); // uid -> status trước đó

  useEffect(() => {
    const prev = prevStatusRef.current;

    // Tìm member mới vừa chuyển sang lost_signal (không phải mình)
    const newLostSignal = members.some((m) => {
      if (m.uid === currentUid) return false;
      const wasLost = prev[m.uid] === "lost_signal";
      const isLost  = m.tracking?.status === "lost_signal";
      return !wasLost && isLost;
    });

    if (newLostSignal) {
      playLostSignalPing();
    }

    // Cập nhật snapshot trạng thái
    const next = {};
    members.forEach((m) => {
      next[m.uid] = m.tracking?.status ?? "no_share";
    });
    prevStatusRef.current = next;
  }, [members, currentUid]);
}
