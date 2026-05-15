// ─── Chat Service — REST API + Firestore fallback ────────────────────────────
//
// Pattern: trip.service.js
// REST API: chatClient (axios) cho conversations CRUD, members, messages write
// Firestore: getMessages() read-only fallback (backend chưa có GET /messages)
//
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { auth, db } from '@/config/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} Group
 * @property {string} id
 * @property {string} owner_uid
 * @property {string} name
 * @property {string} description
 * @property {string|null} thumbnail_url
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {Member[]} members
 * @property {string} lastMsg
 * @property {string} time
 * @property {number} unread
 * @property {boolean} active
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} sender
 * @property {string} avatar
 * @property {string} time
 * @property {string} text
 * @property {boolean} isMine
 * @property {string} type
 * @property {boolean|undefined} seen
 * @property {string|null} url
 * @property {string|null} fileName
 * @property {string|null} placeId
 */

/**
 * @typedef {Object} Member
 * @property {string} uid
 * @property {string} role
 * @property {string} joined_at
 * @property {string} display_name
 * @property {string} username
 * @property {string|null} avatar_url
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

/**
 * Axios instance for chat API.
 * baseURL from VITE_API_BASE_URL, 10s timeout, JSON content-type.
 */
const chatClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — inject Firebase ID token.
 * Throws AUTH_ERROR if no current user.
 * Re-throws getIdToken() errors without wrapping.
 */
chatClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const error = new Error('User not authenticated');
      error.code = 'AUTH_ERROR';
      throw error;
    }
    // Re-throw getIdToken errors as-is (no wrapping)
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — pass-through success; transform errors.
 */
chatClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(transformChatError(error))
);

// ============================================================================
// FIRESTORE — CONVERSATION LIST (READ-ONLY)
// ============================================================================

/**
 * Fetch conversation IDs for the current user from Firestore.
 * Reads from /users/{uid}/conversations (cache collection written by backend).
 * Returns [] if user is not authenticated or collection is empty.
 *
 * @returns {Promise<string[]>}
 */
async function getConversationIdsFromFirestore() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snap = await getDocs(
    collection(db, 'users', uid, 'conversations')
  );
  return snap.docs.map((d) => d.id);
}

/**
 * Fetch a single conversation document from Firestore, including its members subcollection.
 * Members are enriched with profile data from /users/{uid}.
 * Returns null if the document does not exist.
 * Also exported as getConversationFromFirestorePublic for use in hooks.
 *
 * @param {string} conversationId
 * @returns {Promise<Object|null>}
 */
async function getConversationFromFirestore(conversationId) {
  const [convSnap, membersSnap] = await Promise.all([
    getDoc(doc(db, 'conversations', conversationId)),
    getDocs(collection(db, 'conversations', conversationId, 'members')),
  ]);

  if (!convSnap.exists()) return null;

  const data = convSnap.data();

  // Base member data từ subcollection
  const baseMembers = membersSnap.docs.map((d) => {
    const m = d.data();
    return {
      uid:       d.id,
      role:      m.role      ?? '',
      joined_at: m.joined_at?.toDate?.()?.toISOString() ?? m.joined_at ?? '',
    };
  });

  // Enrich với user profiles
  let members = baseMembers;
  if (baseMembers.length > 0) {
    const profileSnaps = await Promise.allSettled(
      baseMembers.map((m) => getDoc(doc(db, 'users', m.uid)))
    );
    members = baseMembers.map((m, i) => {
      const result = profileSnaps[i];
      const profile = result.status === 'fulfilled' && result.value.exists()
        ? result.value.data()
        : null;
      return {
        uid:          m.uid,
        role:         m.role,
        joined_at:    m.joined_at,
        display_name: profile?.fullName ?? profile?.display_name ?? '',
        username:     profile?.username ?? '',
        avatar_url:   profile?.avatar?.url ?? profile?.avatar_url ?? null,
      };
    });
  }

  return {
    id: convSnap.id,
    ...data,
    members,
    // Firestore Timestamps → ISO strings
    created_at: data.created_at?.toDate?.()?.toISOString() ?? data.created_at ?? null,
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? data.updated_at ?? null,
  };
}

/**
 * Public export of getConversationFromFirestore for use outside this module.
 * @param {string} conversationId
 * @returns {Promise<Group|null>}
 */
export async function getConversationFromFirestorePublic(conversationId) {
  const raw = await getConversationFromFirestore(conversationId);
  if (!raw) return null;
  return normalizeConversation(raw);
}

/**
 * Fetch members for a conversation from REST API.
 * Endpoint: GET /conversations/{conversation_id}/members
 * Response: { status_code, message, data: [ { uid, username, display_name, avatar_url, role, joined_at } ] }
 *
 * @param {string} conversationId
 * @returns {Promise<Member[]>}
 */
export async function getMembersFromAPI(conversationId) {
  const response = await chatClient.get(`/conversations/${conversationId}/members`);
  // data là array trực tiếp
  const raw = response.data?.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeMember);
}

/**
 * Fetch members for a conversation.
 * Tries REST API first; falls back to Firestore subcollection + profile enrichment.
 * Used after add/remove member API calls to get the latest member list.
 *
 * @param {string} conversationId
 * @returns {Promise<Member[]>}
 */
export async function getMembersFromFirestore(conversationId) {
  // Thử REST API trước (nhanh hơn và đầy đủ hơn)
  try {
    const apiMembers = await getMembersFromAPI(conversationId);
    if (apiMembers.length > 0) return apiMembers;
  } catch (err) {
    console.warn('[getMembersFromFirestore] REST API failed, falling back to Firestore:', err.message);
  }

  // Fallback: Firestore subcollection + enrich từ /users/{uid}
  const snap = await getDocs(
    collection(db, 'conversations', conversationId, 'members')
  );

  // Base member data từ subcollection (chỉ có uid, role, joined_at)
  const baseMembers = snap.docs.map((d) => {
    const m = d.data();
    return {
      uid:       d.id,
      role:      m.role      ?? '',
      joined_at: m.joined_at?.toDate?.()?.toISOString() ?? m.joined_at ?? '',
    };
  });

  if (baseMembers.length === 0) return [];

  // Batch-fetch user profiles từ /users/{uid} để lấy display_name, username, avatar_url
  const profileSnaps = await Promise.allSettled(
    baseMembers.map((m) => getDoc(doc(db, 'users', m.uid)))
  );

  return baseMembers.map((m, i) => {
    const result = profileSnaps[i];
    const profile = result.status === 'fulfilled' && result.value.exists()
      ? result.value.data()
      : null;

    return {
      uid:          m.uid,
      role:         m.role,
      joined_at:    m.joined_at,
      display_name: profile?.fullName ?? profile?.display_name ?? '',
      username:     profile?.username ?? '',
      avatar_url:   profile?.avatar?.url ?? profile?.avatar_url ?? null,
    };
  });
}

/**
 * Subscribe to real-time updates for the current user's conversation list.
 * Calls `callback` with an array of conversation IDs whenever the list changes.
 * Returns an unsubscribe function.
 *
 * @param {function(string[]): void} callback
 * @returns {function} unsubscribe
 */
export function subscribeToConversationIds(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'users', uid, 'conversations'),
    (snap) => callback(snap.docs.map((d) => d.id)),
    (err) => console.error('[subscribeToConversationIds]', err)
  );
}

// ============================================================================
// LOCAL STORAGE HELPERS (legacy — kept for addConversationId / removeConversationId)
// ============================================================================

const CONV_IDS_KEY = 'b4lu_conversation_ids';

/**
 * Append a conversation ID to localStorage if not already present. Max 200 entries.
 * No-op if ID already exists.
 * @param {string} id
 */
function addConversationId(id) {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONV_IDS_KEY) || '[]');
    const ids = Array.isArray(parsed) ? parsed : [];
    if (ids.includes(id)) return;
    localStorage.setItem(CONV_IDS_KEY, JSON.stringify([...ids, id].slice(-200)));
  } catch { /* ignore */ }
}

/**
 * Remove a conversation ID from localStorage.
 * No-op if ID does not exist.
 * @param {string} id
 */
function removeConversationId(id) {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONV_IDS_KEY) || '[]');
    const ids = Array.isArray(parsed) ? parsed : [];
    if (!ids.includes(id)) return;
    localStorage.setItem(CONV_IDS_KEY, JSON.stringify(ids.filter((x) => x !== id)));
  } catch { /* ignore */ }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Transform axios errors into application errors.
 * Fields: code, statusCode, message, originalError.
 * @param {Error} error - Axios error
 * @returns {Error} Application error
 */
function transformChatError(error) {
  const appError = new Error();
  appError.originalError = error;

  if (error.code === 'ECONNABORTED') {
    appError.code = 'TIMEOUT_ERROR';
    appError.message = 'Request timeout - please try again';
  } else if (error.response?.status === 404) {
    appError.code = 'NOT_FOUND';
    appError.statusCode = 404;
    appError.message = 'Conversation not found';
  } else if (error.response?.status === 403) {
    appError.code = 'FORBIDDEN';
    appError.statusCode = 403;
    appError.message = error.response.data?.message || 'Permission denied';
  } else if (error.response) {
    appError.code = 'SERVER_ERROR';
    appError.statusCode = error.response.status;
    appError.message = error.response.data?.message || error.message;
  } else if (error.request) {
    appError.code = 'NETWORK_ERROR';
    appError.message = 'Network error - please check your connection';
  } else {
    // AUTH_ERROR or other pre-request errors — pass through
    appError.code = error.code || 'UNKNOWN_ERROR';
    appError.message = error.message || 'An unexpected error occurred';
  }

  return appError;
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format an ISO date string for display in conversation/message lists.
 * - today      → "HH:MM" (locale time)
 * - yesterday  → "Yesterday"
 * - < 7 days   → abbreviated weekday ("Mon", "Tue", …)
 * - older      → "DD Mon" (e.g. "05 Jun")
 * - absent/invalid → ""
 *
 * @param {string|null|undefined} isoString
 * @returns {string}
 */
function formatTime(isoString) {
  if (!isoString) return '';
  let date;
  try {
    date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
  } catch {
    return '';
  }

  const now = new Date();
  // Midnight of today (local)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Midnight of yesterday (local)
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  // 7 days ago midnight
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86_400_000);

  if (date >= todayStart) {
    // Today → HH:MM
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (date >= yesterdayStart) {
    return 'Yesterday';
  }
  if (date >= sevenDaysAgo) {
    // Abbreviated weekday
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  // Older → "DD Mon"
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString([], { month: 'short' });
  return `${day} ${month}`;
}

// ============================================================================
// RESPONSE NORMALIZERS
// ============================================================================

/**
 * Normalize a raw member object from API.
 * @param {Object} m
 * @returns {Member}
 */
function normalizeMember(m) {
  return {
    uid:          m.uid          ?? '',
    role:         m.role         ?? '',
    joined_at:    m.joined_at    ?? '',
    display_name: m.display_name ?? '',
    username:     m.username     ?? '',
    avatar_url:   m.avatar_url   ?? null,
  };
}

/**
 * Normalize a raw conversation API response into a Group object.
 * Emits a debug log of the raw data.
 * @param {Object} data - Raw conversation from API
 * @returns {Group}
 */
function normalizeConversation(data) {
  console.debug('[normalizeConversation] raw:', data);

  const lastMsg = data.last_message ?? data.last_message_content ?? '';
  const timeStr = formatTime(data.last_message_at ?? data.updated_at);
  const unread  = data.unread_counts?.[auth.currentUser?.uid] ?? 0;
  const members = Array.isArray(data.members)
    ? data.members.map(normalizeMember)
    : [];

  // member_count từ backend (dùng khi members array không có)
  const memberCount = data.member_count ?? members.length;

  return {
    id:            data.id            ?? '',
    owner_uid:     data.owner_uid     ?? '',
    name:          data.name          ?? '',
    description:   data.description   ?? '',
    thumbnail_url: data.thumbnail_url ?? null,
    created_at:    data.created_at    ?? null,
    updated_at:    data.updated_at    ?? null,
    members,
    member_count:  memberCount,
    lastMsg,
    time:   timeStr,
    unread,
    active: false,
  };
}

/**
 * Normalize a raw message API response into a Message object.
 * @param {Object} data - Raw message from API or Firestore
 * @returns {Message}
 */
function normalizeMessage(data) {
  const isMine = data.sender_uid === auth.currentUser?.uid;
  const senderName = isMine
    ? 'Me'
    : (data.sender_name ?? data.sender_uid ?? 'Unknown');

  // Avatar: 2-char uppercase initials from sender name
  const avatar = senderName
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  // Normalize attachments array từ Firestore: [{ type, value }]
  const attachments = Array.isArray(data.attachments) ? data.attachments : [];
  const firstAttachment = attachments[0] ?? null;

  // Nếu message có attachment image → type = "image", url = value
  const type = firstAttachment?.type ?? data.type ?? 'text';
  const url  = firstAttachment?.value ?? data.url ?? null;

  return {
    id:          data.id       ?? '',
    sender:      senderName,
    avatar,
    time:        formatTime(data.created_at),
    text:        data.content  ?? '',
    isMine,
    type,
    seen:        isMine ? true : undefined,
    url,
    fileName:    data.file_name ?? null,
    placeId:     data.place_id  ?? null,
    attachments,
  };
}

// ============================================================================
// RESPONSE EXTRACTION
// ============================================================================

/**
 * Extract and normalize a conversation from an API response envelope.
 * Supports both:
 *   { data: { conversation: {...} } }
 *   { data: { ...conversation fields... } }
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {Group}
 * @throws {Error} If the extracted object has no `id`
 */
function extractConversation(response) {
  const raw = response.data?.data?.conversation ?? response.data?.data;
  console.log('[extractConversation] raw:', JSON.stringify(raw));
  if (!raw || typeof raw !== 'object' || !raw.id) {
    const err = new Error('Invalid response format from server');
    err.code = 'SERVER_ERROR';
    throw err;
  }
  return normalizeConversation(raw);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate conversation creation/update data.
 * @param {{ name?: string, thumbnail_url?: any }} param0
 * @throws {Error} VALIDATION_ERROR
 */
function validateConversationData({ name, thumbnail_url }) {
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Name must be a non-empty string');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (name.length > 100) {
      const err = new Error('Name must be 100 characters or fewer');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  } else {
    // name is undefined — treat as missing/empty for createConversation context
    // (callers that require name must pass it explicitly)
    const err = new Error('Name must be a non-empty string');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (thumbnail_url !== undefined && thumbnail_url !== null) {
    if (typeof thumbnail_url !== 'string') {
      const err = new Error('thumbnail_url must be a string or null');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }
}

/**
 * Validate a UIDs array parameter.
 * @param {any} uids - Value to validate
 * @param {string} paramName - Name for error messages
 * @throws {Error} VALIDATION_ERROR
 */
function validateUids(uids, paramName) {
  if (!Array.isArray(uids) || uids.length === 0) {
    const err = new Error(`${paramName} must be a non-empty array`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const hasInvalid = uids.some((uid) => uid === null || uid === undefined || uid === '');
  if (hasInvalid) {
    const err = new Error(`${paramName} must not contain null, undefined, or empty string elements`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

// ============================================================================
// CLIENT-SIDE MESSAGE CACHE (sessionStorage)
// Dùng khi backend không có GET /messages và Firestore chỉ lưu document rỗng.
// Messages được lưu trong sessionStorage theo key: `msgs_{conversationId}`
// ============================================================================

const MSG_CACHE_PREFIX = 'b4lu_msgs_';

/**
 * Load cached messages for a conversation from sessionStorage.
 * @param {string} groupId
 * @returns {Message[]}
 */
function loadCachedMessages(groupId) {
  try {
    const raw = sessionStorage.getItem(`${MSG_CACHE_PREFIX}${groupId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save messages for a conversation to sessionStorage.
 * Keeps the latest 200 messages per conversation.
 * @param {string} groupId
 * @param {Message[]} messages
 */
function saveCachedMessages(groupId, messages) {
  try {
    const toSave = messages.slice(-200);
    sessionStorage.setItem(`${MSG_CACHE_PREFIX}${groupId}`, JSON.stringify(toSave));
  } catch { /* ignore quota errors */ }
}

/**
 * Append a single message to the cache for a conversation.
 * @param {string} groupId
 * @param {Message} message
 */
export function appendCachedMessage(groupId, message) {
  const existing = loadCachedMessages(groupId);
  // Tránh duplicate (optimistic update đã có tempId)
  const deduped = existing.filter((m) => m.id !== message.id);
  saveCachedMessages(groupId, [...deduped, message]);
}

/**
 * Remove a message from the cache.
 * @param {string} groupId
 * @param {string} msgId
 */
export function removeCachedMessage(groupId, msgId) {
  const existing = loadCachedMessages(groupId);
  saveCachedMessages(groupId, existing.filter((m) => m.id !== msgId));
}

// ============================================================================
// FIRESTORE FALLBACK — READ-ONLY MESSAGES
// ============================================================================

/**
 * Fetch messages for a conversation from Firestore subcollection.
 * Message schema: { content, id, sender_uid, sent_at, attachments? }
 *
 * @param {string} groupId
 * @returns {Promise<Message[]>}
 */
async function getMessages(groupId) {
  const q = query(
    collection(db, 'conversations', groupId, 'messages'),
    orderBy('sent_at', 'asc')
  );
  let snap;
  try {
    snap = await getDocs(q);
  } catch (err) {
    console.warn('[getMessages] orderBy sent_at failed, retrying without sort:', err.message);
    try {
      snap = await getDocs(collection(db, 'conversations', groupId, 'messages'));
    } catch (err2) {
      console.error('[getMessages] failed:', err2.message);
      return loadCachedMessages(groupId);
    }
  }

  const rawList = snap.docs.map((docSnap) => {
    const d = docSnap.data();
    const sentAtMs = d.sent_at?.toMillis?.() ?? (d.sent_at?.seconds ?? 0) * 1000;
    return {
      raw: {
        id:          docSnap.id,
        sender_uid:  d.sender_uid ?? '',
        content:     d.content    ?? '',
        type:        d.type       ?? 'text',
        url:         d.url        ?? null,
        file_name:   d.file_name  ?? null,
        place_id:    d.place_id   ?? null,
        attachments: Array.isArray(d.attachments) ? d.attachments : [],
        // normalize sent_at → created_at cho normalizeMessage
        created_at:  d.sent_at?.toDate?.()?.toISOString() ?? null,
      },
      sentAtMs,
    };
  });

  // Sort theo timestamp gốc ở client (phòng khi orderBy không hoạt động)
  rawList.sort((a, b) => a.sentAtMs - b.sentAtMs);

  const messages = rawList.map(({ raw }) => normalizeMessage(raw));
  console.debug(`[getMessages] ${groupId}: loaded ${messages.length} messages from Firestore`);

  // Merge với cache (giữ lại optimistic messages chưa có trong Firestore)
  const cached = loadCachedMessages(groupId);
  const firestoreIds = new Set(messages.map((m) => m.id));
  const onlyInCache = cached.filter((m) => !firestoreIds.has(m.id) && m.id.startsWith('temp_'));

  return [...messages, ...onlyInCache];
}

// ─── PUBLIC EXPORTS (Tasks 2-6) ───

// ─── GROUPS ───

/**
 * Fetch all groups the user belongs to.
 *
 * Strategy:
 * 1. Đọc danh sách conversation IDs từ Firestore (/users/{uid}/conversations).
 *    Nếu Firestore trả về danh sách → dùng Firestore để fetch từng conversation.
 * 2. Fallback về localStorage nếu Firestore không trả về ID nào
 *    (user chưa có cache hoặc lỗi Firestore).
 * 3. Với mỗi conversation, ưu tiên đọc từ Firestore trước;
 *    nếu Firestore không có document → gọi REST API.
 *
 * @returns {Promise<Group[]>}
 */
export async function getGroups() {
  // ── Bước 1: Lấy danh sách IDs từ Firestore ──────────────────────────────
  let ids = [];
  try {
    ids = await getConversationIdsFromFirestore();
  } catch (err) {
    console.warn('[getGroups] Firestore IDs fetch failed, falling back to localStorage:', err);
  }

  // ── Fallback: localStorage ───────────────────────────────────────────────
  if (ids.length === 0) {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONV_IDS_KEY) || '[]');
      ids = Array.isArray(parsed) ? parsed : [];
    } catch { /* ignore */ }
  }

  if (ids.length === 0) return [];

  // ── Bước 2: Fetch từng conversation (Firestore → REST fallback) ──────────
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      // Thử Firestore trước
      try {
        const fsData = await getConversationFromFirestore(id);
        if (fsData) {
          console.debug('[getGroups] Firestore hit:', id);
          return normalizeConversation(fsData);
        }
      } catch (err) {
        console.warn('[getGroups] Firestore read failed for', id, err);
      }

      // Fallback: REST API
      console.debug('[getGroups] REST fallback:', id);
      const response = await chatClient.get(`/conversations/${id}`);
      return extractConversation(response);
    })
  );

  const groups = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      groups.push(result.value);
    } else {
      const err = result.reason;
      if (err?.code === 'NOT_FOUND' || err?.statusCode === 404) {
        console.log('[getGroups] pruning deleted conversation:', ids[i]);
        removeConversationId(ids[i]);
      } else {
        console.warn('[getGroups] keeping conversation despite error:', ids[i], err?.code, err?.message);
      }
    }
  });

  return groups;
}

/**
 * Build a map of groupId → members array from a list of groups.
 * Synchronous — no API call needed (members are already on the Group objects).
 *
 * @param {Group[]} groupList
 * @returns {Object.<string, Member[]>}
 */
export function getMembersByGroup(groupList = []) {
  return Object.fromEntries(groupList.map(g => [g.id, g.members]));
}

/**
 * Fetch messages for multiple groups in parallel from Firestore.
 * Uses Promise.allSettled so one failure doesn't reject the whole map.
 * Falls back to [] for any group that fails.
 *
 * @param {string[]} groupIds
 * @returns {Promise<Object.<string, Message[]>>}
 */
export async function getMessagesByGroup(groupIds = []) {
  const results = await Promise.allSettled(
    groupIds.map(async id => [id, await getMessages(id)])
  );
  return Object.fromEntries(
    results.map((r, i) => r.status === 'fulfilled' ? r.value : [groupIds[i], []])
  );
}

// ─── CONVERSATION CRUD ───

/**
 * Fetch a single conversation by ID.
 * Internal helper — not exported.
 *
 * @param {string} id
 * @returns {Promise<Group>}
 */
async function getConversation(id) {
  const response = await chatClient.get(`/conversations/${id}`);
  return extractConversation(response);
}

/**
 * Create a new conversation.
 * Validates name and thumbnail_url before making the API call.
 * Adds the new conversation ID to localStorage on success.
 *
 * @param {{ name: string, description?: string, thumbnail_url?: string|null }} param0
 * @returns {Promise<Group>}
 * @throws {Error} VALIDATION_ERROR if name is invalid
 * @throws {Error} API error if POST fails (ID is NOT added)
 */
export async function createConversation({ name, description, thumbnail_url } = {}) {
  validateConversationData({ name, thumbnail_url });

  const payload = {};
  if (name !== undefined) payload.name = name;
  if (description !== undefined) payload.description = description;
  if (thumbnail_url !== undefined) payload.thumbnail_url = thumbnail_url;

  const response = await chatClient.post('/conversations', payload);

  // Backend trả về data trực tiếp (không có wrapper conversation):
  // { status_code, message, data: { id, owner_uid, name, description, thumbnail_url,
  //   created_at, updated_at, member_count } }
  // → extractConversation xử lý được, nhưng members sẽ rỗng vì chỉ có member_count.
  // Sau khi tạo xong, fetch members từ Firestore để có danh sách đầy đủ.
  const group = extractConversation(response);
  addConversationId(group.id);

  // Nếu backend không trả về members array, thử lấy từ Firestore
  if (group.members.length === 0) {
    try {
      const freshMembers = await getMembersFromFirestore(group.id);
      group.members = freshMembers;
    } catch (err) {
      console.warn('[createConversation] could not fetch members from Firestore:', err.message);
    }
  }

  return group;
}

/**
 * Update an existing conversation.
 * Only sends fields that are explicitly provided (not undefined).
 * null IS a valid value (clears a field).
 * If no fields are provided, returns the existing conversation without making a PATCH.
 *
 * @param {string} id
 * @param {{ name?: string, description?: string, thumbnail_url?: string|null }} param1
 * @returns {Promise<Group>}
 */
export async function updateConversation(id, { name, description, thumbnail_url } = {}) {
  if (name === undefined && description === undefined && thumbnail_url === undefined) {
    return getConversation(id);
  }

  const patch = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (thumbnail_url !== undefined) patch.thumbnail_url = thumbnail_url;

  const response = await chatClient.patch(`/conversations/${id}`, patch);
  return extractConversation(response);
}

/**
 * Delete a conversation.
 * Removes the conversation ID from localStorage on success.
 *
 * @param {string} id
 * @returns {Promise<true>}
 * @throws {Error} 'Permission denied' if 403
 * @throws {Error} code 'NOT_FOUND' if 404
 * @throws {Error} original error for any other failure
 */
export async function deleteConversation(id) {
  try {
    await chatClient.delete(`/conversations/${id}`);
    removeConversationId(id);
    return true;
  } catch (error) {
    if (error.code === 'FORBIDDEN' || error.statusCode === 403) {
      throw new Error('Permission denied');
    }
    if (error.code === 'NOT_FOUND' || error.statusCode === 404) {
      const err = new Error('Conversation not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    throw error;
  }
}

// ─── MEMBERS ───

/**
 * Add members to a group conversation.
 * Validates UIDs before making the API call.
 * The backend handles deduplication — the returned Group reflects the actual member list.
 *
 * @param {string} groupId - ID of the conversation to add members to
 * @param {string[]} uids - Array of user UIDs to add
 * @returns {Promise<Group>} Normalized Group with updated members
 * @throws {Error} VALIDATION_ERROR if uids is not a non-empty array or contains invalid entries
 * @throws {Error} NOT_FOUND (propagated) if groupId does not exist
 */
export async function addMembers(groupId, uids) {
  validateUids(uids, 'uids');
  const response = await chatClient.post(`/conversations/${groupId}/members`, {
    member_uids: uids,
  });
  return extractConversation(response);
}

/**
 * Remove members from a group conversation.
 * Validates UIDs before making the API call.
 * The backend handles no-op cases — the returned Group reflects the actual member list.
 *
 * @param {string} groupId - ID of the conversation to remove members from
 * @param {string[]} uids - Array of user UIDs to remove
 * @returns {Promise<Group>} Normalized Group with updated members
 * @throws {Error} VALIDATION_ERROR if uids is not a non-empty array or contains invalid entries
 * @throws {Error} NOT_FOUND (propagated) if groupId does not exist
 */
export async function removeMembers(groupId, uids) {
  validateUids(uids, 'uids');
  const response = await chatClient.delete(`/conversations/${groupId}/members`, {
    data: { member_uids: uids },
  });
  return extractConversation(response);
}

// ─── MESSAGES ───

/**
 * Send a message to a group conversation.
 *
 * @param {string} groupId
 * @param {{ content?: string, attachments?: Array<{type: string, value: string}> }} param1
 * @returns {Promise<Message>}
 */
export async function sendMessage(groupId, { content, attachments } = {}) {
  const payload = {};
  if (content !== undefined) payload.content = content;
  if (Array.isArray(attachments) && attachments.length > 0) payload.attachments = attachments;

  console.log('[sendMessage] groupId:', groupId, 'payload:', JSON.stringify(payload));

  const response = await chatClient.post(`/conversations/${groupId}/messages`, payload);
  const raw = response.data?.data?.message ?? response.data?.data;
  console.log('[sendMessage] raw:', JSON.stringify(raw));
  return normalizeMessage(raw);
}

/**
 * Delete a message from a group conversation.
 *
 * @param {string} groupId - ID of the conversation containing the message
 * @param {string} msgId - ID of the message to delete
 * @returns {Promise<true>}
 * @throws {Error} 'Permission denied' if 403
 * @throws {Error} code 'NOT_FOUND' if 404
 * @throws {Error} original error for any other failure
 */
export async function deleteMessage(groupId, msgId) {
  try {
    await chatClient.delete(`/conversations/${groupId}/messages/${msgId}`);
    return true;
  } catch (error) {
    if (error.code === 'FORBIDDEN' || error.statusCode === 403) {
      throw new Error('Permission denied');
    }
    if (error.code === 'NOT_FOUND' || error.statusCode === 404) {
      const err = new Error('Message not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    throw error;
  }
}

/**
 * Mark all messages in a conversation as read for the current user.
 * Returns `false` immediately if `groupId` is null, undefined, or empty string.
 * Never throws — any API error is logged and `false` is returned.
 *
 * @param {string|null|undefined} groupId - ID of the conversation to mark as read
 * @returns {Promise<boolean>} `true` on success, `false` on invalid input or any error
 */
export async function markAsRead(groupId) {
  if (groupId === null || groupId === undefined || groupId === '') {
    return false;
  }
  try {
    await chatClient.patch(`/conversations/${groupId}/read`);
    return true;
  } catch (error) {
    console.error('[markAsRead] failed:', error);
    return false;
  }
}

// ─── REAL-TIME LISTENERS ───

/**
 * Subscribe to real-time message updates for a conversation.
 * Calls callback with normalized Message[] on every change.
 * Returns unsubscribe function.
 *
 * @param {string} groupId
 * @param {function(Message[]): void} callback
 * @returns {function} unsubscribe
 */
export function subscribeToMessages(groupId, callback) {
  const q = query(
    collection(db, 'conversations', groupId, 'messages'),
    orderBy('sent_at', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const isMine = d.sender_uid === auth.currentUser?.uid;
        const senderName = isMine ? 'Me' : (d.sender_name ?? d.sender_uid ?? 'Unknown');
        const avatar = senderName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '??';

        const attachments = Array.isArray(d.attachments) ? d.attachments : [];
        const firstAttachment = attachments[0] ?? null;
        const type = firstAttachment?.type ?? d.type ?? 'text';
        const url = firstAttachment?.value ?? d.url ?? null;

        return {
          id:          docSnap.id,
          sender:      senderName,
          avatar,
          time:        d.sent_at?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '',
          text:        d.content   ?? '',
          isMine,
          type,
          seen:        isMine ? true : undefined,
          url,
          fileName:    d.file_name ?? null,
          placeId:     d.place_id  ?? null,
          attachments,
        };
      });
      callback(messages);
    },
    (err) => console.error('[subscribeToMessages]', groupId, err)
  );
}

/**
 * Subscribe to real-time member updates for a conversation.
 * Uses Firestore onSnapshot to detect changes, then fetches full member data
 * (including display_name) from REST API GET /conversations/{id}/members.
 * Falls back to Firestore + profile enrichment if API fails.
 *
 * @param {string} groupId
 * @param {function(Member[]): void} callback
 * @returns {function} unsubscribe
 */
export function subscribeToMembers(groupId, callback) {
  return onSnapshot(
    collection(db, 'conversations', groupId, 'members'),
    async (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }

      // Dùng REST API để lấy members đầy đủ (có display_name, username, avatar_url)
      try {
        const apiMembers = await getMembersFromAPI(groupId);
        if (apiMembers.length > 0) {
          callback(apiMembers);
          return;
        }
      } catch (err) {
        console.warn('[subscribeToMembers] REST API failed, falling back to Firestore enrich:', err.message);
      }

      // Fallback: enrich từ /users/{uid}
      const baseMembers = snapshot.docs.map((d) => {
        const m = d.data();
        return {
          uid:       d.id,
          role:      m.role      ?? '',
          joined_at: m.joined_at?.toDate?.()?.toISOString() ?? m.joined_at ?? '',
        };
      });

      try {
        const profileSnaps = await Promise.allSettled(
          baseMembers.map((m) => getDoc(doc(db, 'users', m.uid)))
        );
        const members = baseMembers.map((m, i) => {
          const result = profileSnaps[i];
          const profile = result.status === 'fulfilled' && result.value.exists()
            ? result.value.data()
            : null;
          return {
            uid:          m.uid,
            role:         m.role,
            joined_at:    m.joined_at,
            display_name: profile?.fullName ?? profile?.display_name ?? '',
            username:     profile?.username ?? '',
            avatar_url:   profile?.avatar?.url ?? profile?.avatar_url ?? null,
          };
        });
        callback(members);
      } catch (err) {
        console.error('[subscribeToMembers] profile enrich failed:', err);
        callback(baseMembers.map((m) => ({ ...m, display_name: '', username: '', avatar_url: null })));
      }
    },
    (err) => console.error('[subscribeToMembers]', groupId, err)
  );
}

// ─── AI CONVERSATION ───

/**
 * Send messages to the AI conversation endpoint and get a reply.
 * Uses native fetch with a static API token (not chatClient).
 *
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string>} AI reply content, or "" if no content in response
 * @throws {Error} "AI API error {status}" on non-2xx response
 * @throws {Error} "AI API error network" on network failure
 */
export async function sendConversation(messages) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
  const STATIC_TOKEN = import.meta.env.VITE_API_TOKEN ?? '';

  let res;
  try {
    res = await fetch(`${BASE_URL}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STATIC_TOKEN}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new Error('AI API error network');
  }

  if (!res.ok) {
    throw new Error(`AI API error ${res.status}`);
  }

  const data = await res.json();
  return (
    data.response ??
    data.messages?.[data.messages.length - 1]?.content ??
    ''
  );
}
