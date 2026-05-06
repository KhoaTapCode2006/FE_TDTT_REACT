// ─── Chat Service — Firestore ─────────────────────────────────────────────────
//
// Cấu trúc Firestore:
//   conversations/{groupId}                  — thông tin nhóm
//   conversations/{groupId}/messages/{msgId} — tin nhắn
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentUid = () =>
  auth.currentUser?.uid ?? import.meta.env.VITE_CURRENT_UID ?? "me";

const getCurrentDisplayName = () =>
  auth.currentUser?.displayName ?? auth.currentUser?.email ?? "Me";

const CONV_COL = "conversations";

/** Chuyển Firestore doc → group object dùng trong UI */
function docToGroup(docSnap) {
  const d = docSnap.data();
  return {
    id:            docSnap.id,
    owner_uid:     d.owner_uid ?? "",
    name:          d.name ?? "",
    description:   d.description ?? "",
    thumbnail_url: d.thumbnail_url ?? null,
    created_at:    d.created_at?.toDate?.()?.toISOString() ?? null,
    updated_at:    d.updated_at?.toDate?.()?.toISOString() ?? null,
    members:       d.members ?? [],
    lastMsg:       d.last_message ?? "",
    time:          d.last_message_at ? formatTime(d.last_message_at.toDate()) : "",
    unread:        d.unread_counts?.[getCurrentUid()] ?? 0,
    active:        false,
  };
}

/** Chuyển Firestore doc → message object dùng trong UI */
function docToMessage(docSnap) {
  const d      = docSnap.data();
  const uid    = getCurrentUid();
  const isMine = d.sender_uid === uid;
  const name   = d.sender_name ?? d.sender_uid ?? "Unknown";
  return {
    id:       docSnap.id,
    sender:   isMine ? "Me" : name,
    avatar:   isMine ? "ME" : name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    time:     d.created_at ? formatTime(d.created_at.toDate()) : "",
    text:     d.content ?? "",
    isMine,
    type:     d.type ?? "text",
    seen:     isMine ? true : undefined,
    url:      d.url ?? null,
    fileName: d.file_name ?? null,
    placeId:  d.place_id ?? null,
  };
}

function formatTime(date) {
  if (!date) return "";
  const diffDays = Math.floor((Date.now() - date) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

// ─── Groups ───────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách nhóm mà user hiện tại là thành viên.
 */
export async function getGroups() {
  const uid = getCurrentUid();
  const q   = query(
    collection(db, CONV_COL),
    where("member_uids", "array-contains", uid),
    orderBy("updated_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToGroup);
}

/**
 * Lấy map groupId → members[] từ groupList đã fetch.
 */
export function getMembersByGroup(groupList = []) {
  return Object.fromEntries(groupList.map((g) => [g.id, g.members]));
}

/**
 * Lấy map groupId → messages[] cho nhiều nhóm cùng lúc.
 */
export async function getMessagesByGroup(groupIds = []) {
  const entries = await Promise.all(
    groupIds.map(async (id) => {
      const msgs = await getMessages(id);
      return [id, msgs];
    })
  );
  return Object.fromEntries(entries);
}

/**
 * Lấy tin nhắn của một nhóm, sắp xếp theo thời gian.
 */
export async function getMessages(groupId) {
  const q    = query(
    collection(db, CONV_COL, groupId, "messages"),
    orderBy("created_at", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToMessage);
}

// ─── CRUD Conversations ───────────────────────────────────────────────────────

/**
 * Tạo nhóm chat mới.
 */
export async function createConversation({ name, description, thumbnail_url }) {
  const uid         = getCurrentUid();
  const displayName = getCurrentDisplayName();
  const avatarUrl   = auth.currentUser?.photoURL ?? null;

  const ownerMember = {
    uid,
    role:         "owner",
    joined_at:    new Date().toISOString(),
    display_name: displayName,
    username:     displayName.toLowerCase().replace(/\s+/g, "_"),
    avatar_url:   avatarUrl,
  };

  const payload = {
    owner_uid:     uid,
    name,
    description:   description ?? "",
    thumbnail_url: thumbnail_url ?? null,
    members:       [ownerMember],
    member_uids:   [uid],           // dùng để query array-contains
    last_message:  "",
    last_message_at: null,
    unread_counts: { [uid]: 0 },
    created_at:    serverTimestamp(),
    updated_at:    serverTimestamp(),
  };

  const ref  = await addDoc(collection(db, CONV_COL), payload);
  const snap = await getDoc(ref);
  return docToGroup(snap);
}

/**
 * Cập nhật thông tin nhóm.
 */
export async function updateConversation(id, { name, description, thumbnail_url }) {
  const ref = doc(db, CONV_COL, id);
  const updates = { updated_at: serverTimestamp() };
  if (name          !== undefined) updates.name          = name;
  if (description   !== undefined) updates.description   = description;
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
  await updateDoc(ref, updates);
  const snap = await getDoc(ref);
  return docToGroup(snap);
}

/**
 * Xóa nhóm chat và toàn bộ tin nhắn.
 */
export async function deleteConversation(id) {
  // Xóa tất cả messages trước
  const msgSnap = await getDocs(collection(db, CONV_COL, id, "messages"));
  await Promise.all(msgSnap.docs.map((d) => deleteDoc(d.ref)));
  // Xóa conversation
  await deleteDoc(doc(db, CONV_COL, id));
}

// ─── Members ──────────────────────────────────────────────────────────────────

/**
 * Thêm thành viên vào nhóm.
 */
export async function addMembers(groupId, uids) {
  const ref      = doc(db, CONV_COL, groupId);
  const snap     = await getDoc(ref);
  const existing = (snap.data()?.members ?? []).map((m) => m.uid);

  const newMembers = uids
    .filter((uid) => !existing.includes(uid))
    .map((uid) => ({
      uid,
      role:         "member",
      joined_at:    new Date().toISOString(),
      display_name: uid,
      username:     uid,
      avatar_url:   null,
    }));

  if (newMembers.length === 0) return docToGroup(snap);

  await updateDoc(ref, {
    members:      arrayUnion(...newMembers),
    member_uids:  arrayUnion(...uids),
    updated_at:   serverTimestamp(),
  });

  const updated = await getDoc(ref);
  return docToGroup(updated);
}

/**
 * Xóa thành viên khỏi nhóm.
 */
export async function removeMembers(groupId, uids) {
  const ref  = doc(db, CONV_COL, groupId);
  const snap = await getDoc(ref);
  const data = snap.data();

  console.log("[removeMembers] groupId:", groupId);
  console.log("[removeMembers] uids to remove:", uids);
  console.log("[removeMembers] current members:", data?.members);
  console.log("[removeMembers] current member_uids:", data?.member_uids);

  // Filter thủ công thay vì arrayRemove để tránh lỗi deep equality với object
  const remainingMembers = (data?.members ?? []).filter((m) => !uids.includes(m.uid));
  const remainingUids    = (data?.member_uids ?? []).filter((uid) => !uids.includes(uid));

  console.log("[removeMembers] remainingMembers:", remainingMembers);
  console.log("[removeMembers] remainingUids:", remainingUids);

  try {
    await updateDoc(ref, {
      members:     remainingMembers,
      member_uids: remainingUids,
      updated_at:  serverTimestamp(),
    });
    console.log("[removeMembers] updateDoc SUCCESS");
  } catch (err) {
    console.error("[removeMembers] updateDoc FAILED:", err.code, err.message);
    throw err;
  }

  const updated = await getDoc(ref);
  return docToGroup(updated);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Gửi tin nhắn vào nhóm.
 */
export async function sendMessage(groupId, { type, content, url, file_name, place_id }) {
  const uid  = getCurrentUid();
  const name = getCurrentDisplayName();

  const msgPayload = {
    sender_uid:  uid,
    sender_name: name,
    type:        type ?? "text",
    content:     content ?? "",
    url:         url ?? null,
    file_name:   file_name ?? null,
    place_id:    place_id ?? null,
    created_at:  serverTimestamp(),
  };

  // Thêm message vào subcollection
  const msgRef = await addDoc(
    collection(db, CONV_COL, groupId, "messages"),
    msgPayload
  );

  // Cập nhật last_message trên conversation
  await updateDoc(doc(db, CONV_COL, groupId), {
    last_message:    content ?? "",
    last_message_at: serverTimestamp(),
    updated_at:      serverTimestamp(),
  });

  return { id: msgRef.id, ...msgPayload };
}

/**
 * Xóa tin nhắn.
 */
export async function deleteMessage(groupId, msgId) {
  await deleteDoc(doc(db, CONV_COL, groupId, "messages", msgId));
}

/**
 * Đánh dấu đã đọc — reset unread count của user hiện tại.
 */
export async function markAsRead(groupId) {
  const uid = getCurrentUid();
  await updateDoc(doc(db, CONV_COL, groupId), {
    [`unread_counts.${uid}`]: 0,
  });
}

// ─── AI Conversation ──────────────────────────────────────────────────────────

const BASE_URL     = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const STATIC_TOKEN = import.meta.env.VITE_API_TOKEN    ?? "";

export async function sendConversation(messages) {
  const res = await fetch(`${BASE_URL}/conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STATIC_TOKEN}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw new Error(`AI API error ${res.status}`);

  const data = await res.json();
  return (
    data.response ??
    data.messages?.[data.messages.length - 1]?.content ??
    ""
  );
}
