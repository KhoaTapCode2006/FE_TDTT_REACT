// ─── useNotifications ─────────────────────────────────────────────────────────
// Lắng nghe realtime notifications từ Firestore: users/{uid}/notifications
// Trả về: { notifications, unreadCount, markAsRead, loading }

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * @param {string|null} uid
 */
export function useNotifications(uid) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    const colRef = collection(db, "users", uid, "notifications");
    const q = query(colRef, orderBy("send_at", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNotifications(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useNotifications] Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Đánh dấu 1 notification là đã đọc
  const markAsRead = async (notifId) => {
    if (!uid) return;
    try {
      const ref = doc(db, "users", uid, "notifications", notifId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("[useNotifications] markAsRead error:", err);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
