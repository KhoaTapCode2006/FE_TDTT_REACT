// ─── useNotifications ─────────────────────────────────────────────────────────
// Lắng nghe realtime notifications từ Firestore: users/{uid}/notifications
// Trả về: { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading }

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import axios from "axios";
import { db } from "../../../config/firebase";
import { auth } from "../../../config/firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_LOCAL_API ||
  "http://localhost:8000";

const notifClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

notifClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");
  const token = await currentUser.getIdToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

  /**
   * Đánh dấu 1 notification là đã đọc.
   * Gọi PATCH /users/me/notifications/{notification_id} với body { read: true }.
   * Firestore onSnapshot sẽ tự cập nhật UI sau khi backend write.
   */
  const markAsRead = async (notifId) => {
    if (!uid || !notifId) return;
    try {
      await notifClient.patch(`/users/me/notifications/${notifId}`, { read: true });
    } catch (err) {
      console.error("[useNotifications] markAsRead error:", err);
    }
  };

  /**
   * Đánh dấu tất cả notifications chưa đọc là đã đọc.
   */
  const markAllAsRead = async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  /**
   * Xóa 1 notification.
   * Gọi DELETE /users/me/notifications/{notification_id}.
   */
  const deleteNotification = async (notifId) => {
    if (!uid || !notifId) return;
    try {
      await notifClient.delete(`/users/me/notifications/${notifId}`);
    } catch (err) {
      console.error("[useNotifications] deleteNotification error:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification };
}
