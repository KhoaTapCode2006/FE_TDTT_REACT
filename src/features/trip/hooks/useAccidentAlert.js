// ─── useAccidentAlert ──────────────────────────────────────────────────────────
// Theo dõi danh sách members, phát âm thanh cảnh báo khi có member mới
// chuyển sang trạng thái accident = true.
// Không phát âm cho chính user hiện tại (họ là người bấm nút).

import { useEffect, useRef } from "react";

/**
 * Phát âm thanh cảnh báo khẩn cấp bằng Web Audio API.
 */
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const beepAt = (startTime, freq = 880) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gain.gain.setValueAtTime(0.4, startTime + 0.12);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };

    const now = ctx.currentTime;
    beepAt(now,        880);
    beepAt(now + 0.2,  880);
    beepAt(now + 0.4, 1100);

    setTimeout(() => ctx.close(), 1500);
  } catch (err) {
    console.warn("[useAccidentAlert] Web Audio API not available:", err);
  }
}

/**
 * @param {Array}  members    - danh sách members từ useTripMembers
 * @param {string} currentUid - UID của user hiện tại (không alert cho chính họ)
 */
export function useAccidentAlert(members, currentUid) {
  const prevAccidentRef = useRef({});

  useEffect(() => {
    const prev = prevAccidentRef.current;
    let shouldAlert = false;

    members.forEach((m) => {
      if (m.uid === currentUid) return;
      const wasAccident = prev[m.uid] === true;
      const isAccident  = m.tracking?.accident === true;
      if (!wasAccident && isAccident) shouldAlert = true;
    });

    if (shouldAlert) playAlertSound();

    const next = {};
    members.forEach((m) => { next[m.uid] = m.tracking?.accident === true; });
    prevAccidentRef.current = next;
  }, [members, currentUid]);
}
