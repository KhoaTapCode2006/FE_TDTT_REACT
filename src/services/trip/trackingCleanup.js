// ─── trackingCleanup ──────────────────────────────────────────────────────────
// Set tracking.status = "lost_signal" khi user logout.
// Không xóa lat/lng vì Firestore rules yêu cầu chúng phải là number.

import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Set tracking.status = "lost_signal" cho tất cả trips của user khi logout.
 * Nếu tripIds rỗng, tự query Firestore để lấy current_trip.
 * @param {string} uid - UID của user đang logout
 * @param {string[]} tripIds - Danh sách trip IDs mà user là thành viên
 */
export async function clearTrackingOnLogout(uid, tripIds) {
  if (!uid) return;

  let ids = tripIds ?? [];

  // Fallback: nếu store rỗng (user logout từ trang khác), query Firestore
  if (!ids.length) {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const currentTripId = userSnap.exists() ? (userSnap.data()?.current_trip ?? null) : null;
      if (currentTripId) ids = [currentTripId];
    } catch (err) {
      console.warn("[clearTrackingOnLogout] Could not fetch current_trip:", err);
    }
  }

  if (!ids.length) {
    console.log("[clearTrackingOnLogout] No trip IDs found, skipping.");
    return;
  }

  console.log("[clearTrackingOnLogout] Setting lost_signal for uid:", uid, "trips:", ids);

  await Promise.allSettled(
    ids.map((tripId) =>
      updateDoc(doc(db, "trips", tripId, "members", uid), {
        // Chỉ update status — không xóa lat/lng vì rules yêu cầu chúng phải là number
        "tracking.status":     "lost_signal",
        "tracking.updated_at": serverTimestamp(),
      }).then(() => {
        console.log("[clearTrackingOnLogout] SUCCESS trip:", tripId);
      }).catch((err) => {
        console.warn("[clearTrackingOnLogout] FAILED trip:", tripId, err.message);
      })
    )
  );
}
