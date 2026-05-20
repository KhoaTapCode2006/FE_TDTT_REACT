// ─── useAccidentAlert ──────────────────────────────────────────────────────────
// Theo dõi danh sách members, phát âm thanh cảnh báo liên tục khi có member
// đang ở trạng thái accident = true.
// Dừng âm thanh khi tất cả accident được giải quyết (accident = false).
// Không phát âm cho chính user hiện tại (họ là người bấm nút).

import { useEffect, useRef } from "react";

/**
 * Tạo một AudioContext loop phát cảnh báo liên tục.
 * Trả về hàm stop() để dừng.
 */
function startAlertLoop() {
  let stopped = false;
  let ctx;

  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (err) {
    console.warn("[useAccidentAlert] Web Audio API not available:", err);
    return () => {};
  }

  // Một chu kỳ beep: 3 tiếng, tổng ~0.7s, sau đó lặp lại sau 0.3s nghỉ → chu kỳ 1s
  const CYCLE = 1.0;

  const scheduleBeeps = (startTime) => {
    if (stopped) return;

    const beepAt = (t, freq) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
      gain.gain.setValueAtTime(0.4, t + 0.12);
      gain.gain.linearRampToValueAtTime(0, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    };

    beepAt(startTime,        880);
    beepAt(startTime + 0.2,  880);
    beepAt(startTime + 0.4, 1100);

    // Lên lịch chu kỳ tiếp theo
    const delay = (startTime + CYCLE - ctx.currentTime) * 1000;
    setTimeout(() => {
      if (!stopped) scheduleBeeps(ctx.currentTime);
    }, Math.max(delay, 0));
  };

  scheduleBeeps(ctx.currentTime);

  return () => {
    stopped = true;
    try { ctx.close(); } catch (_) {}
  };
}

/**
 * @param {Array}  members    - danh sách members từ useTripMembers
 * @param {string} currentUid - UID của user hiện tại (không alert cho chính họ)
 */
export function useAccidentAlert(members, currentUid) {
  const prevAccidentRef = useRef({});
  const stopAlertRef    = useRef(null); // hàm dừng loop hiện tại

  useEffect(() => {
    const prev = prevAccidentRef.current;

    // Kiểm tra có member nào (không phải mình) đang accident không
    const anyAccident = members.some(
      (m) => m.uid !== currentUid && m.tracking?.accident === true
    );

    // Phát hiện member mới vừa chuyển sang accident
    const newAccident = members.some((m) => {
      if (m.uid === currentUid) return false;
      return !prev[m.uid] && m.tracking?.accident === true;
    });

    if (anyAccident) {
      // Bắt đầu loop nếu chưa chạy và có member mới báo accident
      if (newAccident && !stopAlertRef.current) {
        stopAlertRef.current = startAlertLoop();
      }
    } else {
      // Không còn ai accident → dừng âm thanh
      if (stopAlertRef.current) {
        stopAlertRef.current();
        stopAlertRef.current = null;
      }
    }

    // Cập nhật snapshot trạng thái
    const next = {};
    members.forEach((m) => { next[m.uid] = m.tracking?.accident === true; });
    prevAccidentRef.current = next;
  }, [members, currentUid]);

  // Dọn dẹp khi component unmount
  useEffect(() => {
    return () => {
      if (stopAlertRef.current) {
        stopAlertRef.current();
        stopAlertRef.current = null;
      }
    };
  }, []);
}
