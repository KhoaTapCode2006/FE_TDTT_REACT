// ─── useGroupChat ──────────────────────────────────────────────────────────────
// Quản lý mọi state (danh sách nhóm, tin nhắn, members, UI toggles) 
// và xử lý toàn bộ business logic: load dữ liệu ban đầu, tạo/sửa/xóa nhóm, gửi tin nhắn (bao gồm gọi AI qua sendConversation), thêm/xóa member.

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  getGroups,
  getMembersByGroup,
  getMessagesByGroup,
  getMembersFromFirestore,
  getMembersFromAPI,
  appendCachedMessage,
  removeCachedMessage,
  createConversation,
  updateConversation,
  deleteConversation,
  addMembers,
  removeMembers,
  sendMessage,
  deleteMessage,
  markAsRead,
  sendConversation,
  subscribeToMessages,
  subscribeToMembers,
  subscribeToConversationIds,
  subscribeToUserConversations,
  getConversationFromFirestorePublic,
} from "../../../services/backend/chat.service";
import { uploadFile } from "../../../services/backend/upload.service";

// ─── useGroupChat ──────────────────────────────────────────────────────────────

export function useGroupChat() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroupState] = useState(null);
  const [messagesByGroup, setMessagesByGroup] = useState({});
  const [membersByGroup, setMembersByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  // Danh sách attachments chờ gửi (tối đa MAX_ATTACHMENTS items, lộn xộn ảnh + địa điểm)
  // Mỗi item: { id, type: 'image'|'place', url?, uploading?, name?, address?, propertyToken?, gps? }
  const MAX_ATTACHMENTS = 5;
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  // Cache uid → display_name để resolve sender name
  const userNameCacheRef = useRef({});

  // ── Load dữ liệu ban đầu ────────────────────────────────────────────────────
  useEffect(() => {
    // Chờ Firebase Auth restore session trước khi gọi API
    // onAuthStateChanged fires once immediately with current user (or null)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Chưa đăng nhập hoặc session chưa restore — không load
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const groupList = await getGroups();

        // getMembersByGroup giờ là hàm sync (nhận groups đã fetch sẵn)
        const membersMap = getMembersByGroup(groupList);

        // Fetch messages song song cho tất cả groups
        const messagesMap = await getMessagesByGroup(groupList.map((g) => g.id));

        // Resolve display names cho tất cả tin nhắn ban đầu
        const currentUid = auth.currentUser?.uid;
        const enrichedMessagesMap = {};
        
        for (const [groupId, rawMessages] of Object.entries(messagesMap)) {
          const enriched = await Promise.all(
            rawMessages.map(async (msg) => {
              if (msg.isMine) return msg;
              const uid = msg.senderUid;
              if (!uid || msg.sender !== uid) return msg; // sender đã được resolve
              
              // Resolve display name từ Firestore
              try {
                const snap = await getDoc(doc(db, 'users', uid));
                if (snap.exists()) {
                  const profile = snap.data();
                  const name = profile?.fullName ?? profile?.display_name ?? profile?.username ?? uid;
                  userNameCacheRef.current[uid] = name;
                  return {
                    ...msg,
                    sender: name,
                    avatar: name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '??',
                  };
                }
              } catch { /* ignore */ }
              return msg;
            })
          );
          enrichedMessagesMap[groupId] = enriched;
        }

        setGroups(groupList);
        setMembersByGroup(membersMap);
        setMessagesByGroup(enrichedMessagesMap);

        if (groupList.length > 0) setActiveGroupState(groupList[0].id);
      } catch (err) {
        console.error("useGroupChat init error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }

      // Chỉ load một lần khi user sẵn sàng, không re-run mỗi khi auth thay đổi
      unsubscribe();
    });

    return () => unsubscribe();
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const messages = messagesByGroup[activeGroup] ?? [];
  const currentGroup = groups.find((g) => g.id === activeGroup) ?? groups[0];
  const currentMembers = membersByGroup[activeGroup] ?? [];

  // ── Real-time listener cho danh sách conversation IDs của user ─────────────
  // ── Real-time listener cho danh sách conversation IDs của user ─────────────
  // Khi acc khác add user này vào group, Firestore sẽ write vào
  // /users/{uid}/conversations/{groupId} → listener này sẽ bắt được và load group mới.
  // Đồng thời khi latest_msg thay đổi (tin nhắn mới), cập nhật sidebar ngay lập tức.
  useEffect(() => {
    // Không dùng `loading` làm guard vì Firestore onSnapshot fire ngay lập tức
    // trước khi loading=false, dẫn đến bỏ sót event.
    // Thay vào đó, track các IDs đã biết để chỉ xử lý IDs thực sự mới.
    let knownIds = new Set();
    let initialized = false;

    const unsub = subscribeToUserConversations(async (docs) => {
      const ids = docs.map((d) => d.id);

      if (!initialized) {
        // Lần fire đầu tiên: chỉ ghi nhận IDs hiện có, không fetch gì thêm
        // (data đã được load trong useEffect init ở trên)
        knownIds = new Set(ids);
        initialized = true;
        return;
      }

      const newIds = ids.filter((id) => !knownIds.has(id));
      const removedIds = [...knownIds].filter((id) => !ids.includes(id));

      // Cập nhật knownIds
      ids.forEach((id) => knownIds.add(id));
      removedIds.forEach((id) => knownIds.delete(id));

      // Xử lý remove
      if (removedIds.length > 0) {
        const removedSet = new Set(removedIds);
        setGroups((prev) => prev.filter((g) => !removedSet.has(g.id)));
        setActiveGroupState((prev) => {
          if (!removedSet.has(prev)) return prev;
          // Chuyển sang group khác nếu activeGroup bị xóa
          return null; // sẽ được set lại bởi derived state
        });
      }

      // Cập nhật latest_msg cho các group đã biết (tin nhắn mới)
      const existingDocs = docs.filter((d) => !newIds.includes(d.id) && !removedIds.includes(d.id));
      if (existingDocs.length > 0) {
        const currentUid = auth.currentUser?.uid;

        // Resolve sender names cho tất cả existingDocs
        const senderUids = new Set(
          existingDocs
            .map((d) => d.latest_msg?.sender_uid)
            .filter((uid) => uid && uid !== currentUid)
        );
        const senderNameMap = {};
        await Promise.allSettled(
          [...senderUids].map(async (senderUid) => {
            try {
              const snap = await getDoc(doc(db, 'users', senderUid));
              if (snap.exists()) {
                const p = snap.data();
                senderNameMap[senderUid] = p?.fullName ?? p?.display_name ?? p?.username ?? senderUid.slice(0, 6);
              }
            } catch { /* ignore */ }
          })
        );

        setGroups((prev) => prev.map((g) => {
          const userCache = existingDocs.find((d) => d.id === g.id);
          if (!userCache?.latest_msg) return g;
          const lm = userCache.latest_msg;
          // Normalize sent_at từ Firestore Timestamp
          const sentAt = lm.sent_at?.toDate?.()?.toISOString?.() ?? lm.sent_at ?? null;
          // Tính time string
          const timeStr = sentAt ? (() => {
            const d = new Date(sentAt);
            if (isNaN(d.getTime())) return g.time;
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
            const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86_400_000);
            if (d >= todayStart) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (d >= yesterdayStart) return 'Yesterday';
            if (d >= sevenDaysAgo) return d.toLocaleDateString([], { weekday: 'short' });
            return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString([], { month: 'short' })}`;
          })() : g.time;
          const senderUid = lm.sender_uid ?? '';
          const senderName = senderUid
            ? (senderUid === currentUid ? 'Bạn' : (senderNameMap[senderUid] ?? senderUid.slice(0, 6)))
            : g.lastMsgSender;
          return {
            ...g,
            lastMsg: lm.content ?? g.lastMsg,
            lastMsgSender: senderName,
            time: timeStr,
            unread: lm.unread_count ?? g.unread,
          };
        }));
      }

      if (newIds.length === 0) return;

      console.log('[subscribeToUserConversations] new group IDs:', newIds);

      // Fetch conversation + members cho các group mới
      const results = await Promise.allSettled(
        newIds.map((id) => getConversationFromFirestorePublic(id))
      );

      const newGroups = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);

      if (newGroups.length === 0) return;

      console.log('[subscribeToUserConversations] fetched new groups:', newGroups.map((g) => g.id));

      // Add groups vào state
      setGroups((prev) => {
        const existingSet = new Set(prev.map((g) => g.id));
        const toAdd = newGroups.filter((g) => !existingSet.has(g.id));
        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });

      // Init messages
      newGroups.forEach((g) => {
        setMessagesByGroup((prev) => ({ ...prev, [g.id]: prev[g.id] ?? [] }));
      });

      // Gọi GET /conversations/{id}/members để lấy members đầy đủ
      await Promise.allSettled(
        newGroups.map(async (g) => {
          try {
            const freshMembers = await getMembersFromAPI(g.id);
            console.log('[subscribeToUserConversations] members for', g.id, ':', freshMembers.length);
            setMembersByGroup((prev) => ({
              ...prev,
              [g.id]: freshMembers.length > 0 ? freshMembers : (prev[g.id] ?? g.members),
            }));
          } catch (err) {
            console.warn('[subscribeToUserConversations] getMembersFromAPI failed for', g.id, err.message);
            setMembersByGroup((prev) => ({ ...prev, [g.id]: prev[g.id] ?? g.members }));
          }
        })
      );
    });

    return () => unsub();
  }, []); // Chạy một lần duy nhất khi mount

  /**
   * Resolve display name cho một uid.
   * Dùng cache trước, nếu miss thì fetch /users/{uid} từ Firestore.
   */
  const resolveDisplayName = async (uid) => {
    if (!uid) return uid;
    if (userNameCacheRef.current[uid]) return userNameCacheRef.current[uid];
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const profile = snap.data();
        const name = profile?.fullName ?? profile?.display_name ?? profile?.username ?? uid;
        userNameCacheRef.current[uid] = name;
        return name;
      }
    } catch { /* ignore */ }
    return uid;
  };

  // ── Real-time listener cho messages và members của activeGroup ──────────────
  useEffect(() => {
    if (!activeGroup) return;

    const unsubMessages = subscribeToMessages(activeGroup, async (rawMessages) => {
      // Enrich sender name cho các tin nhắn không phải của mình
      const enriched = await Promise.all(
        rawMessages.map(async (msg) => {
          if (msg.isMine) return msg;
          // Nếu đã có tên đẹp (sender_name từ Firestore) thì giữ nguyên
          const uid = msg.senderUid;
          if (!uid || msg.sender !== uid) return msg; // sender đã được resolve
          const name = await resolveDisplayName(uid);
          if (name === uid) return msg;
          return {
            ...msg,
            sender: name,
            avatar: name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '??',
          };
        })
      );
      // Giữ lại các botMsg local (isTyping=true) chưa có trong Firestore
      setMessagesByGroup((prev) => {
        const existing = prev[activeGroup] ?? [];
        const localBotMsgs = existing.filter((m) => m.isTyping === true);
        return { ...prev, [activeGroup]: [...enriched, ...localBotMsgs] };
      });
    });

    const unsubMembers = subscribeToMembers(activeGroup, (newMembers) => {
      // Populate cache từ members list
      newMembers.forEach((m) => {
        if (m.uid && m.display_name) {
          userNameCacheRef.current[m.uid] = m.display_name;
        }
      });
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: newMembers }));
    });

    return () => {
      unsubMessages();
      unsubMembers();
    };
  }, [activeGroup]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const setActiveGroup = async (id) => {
    setActiveGroupState(id);
    setInput("");
    // Reset unread count trên backend
    markAsRead(id).catch(console.error);
    // Reset unread count trên UI ngay lập tức
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, unread: 0 } : g)));
  };

  const handleCreateGroup = async ({ name, description, thumbnailUrl }) => {
    try {
      const newGroup = await createConversation({
        name,
        description: description || undefined,
        thumbnail_url: thumbnailUrl || undefined,
      });
      setGroups((prev) => [newGroup, ...prev]);
      setMessagesByGroup((prev) => ({ ...prev, [newGroup.id]: [] }));
      setMembersByGroup((prev) => ({ ...prev, [newGroup.id]: newGroup.members }));
      setActiveGroupState(newGroup.id);
      setInput("");
    } catch (err) {
      console.error("handleCreateGroup error:", err);
    }
  };

  const handleUpdateGroup = async ({ id, name, description, thumbnailUrl }) => {
    try {
      const updated = await updateConversation(id, {
        name,
        description: description || undefined,
        thumbnail_url: thumbnailUrl || undefined,
      });
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    } catch (err) {
      console.error("handleUpdateGroup error:", err);
    }
  };

  const handleDeleteGroup = async () => {    try {
      await deleteConversation(activeGroup);
      const remaining = groups.filter((g) => g.id !== activeGroup);
      setGroups(remaining);
      setMessagesByGroup((prev) => { const n = { ...prev }; delete n[activeGroup]; return n; });
      setMembersByGroup((prev) => { const n = { ...prev }; delete n[activeGroup]; return n; });
      setShowRightPanel(false);
      setInput("");
      if (remaining.length > 0) setActiveGroupState(remaining[0].id);
    } catch (err) {
      console.error("handleDeleteGroup error:", err);
    }
  };

  // ── Chọn ảnh → upload ngay, lưu pending ────────────────────────────────────
  const handlePickImage = async (file) => {
    if (!file || !activeGroup) return;
    // Kiểm tra giới hạn tối đa
    if (pendingAttachments.length >= MAX_ATTACHMENTS) return;

    const tempId = `img_${Date.now()}_${Math.random()}`;
    // Thêm placeholder uploading ngay lập tức
    setPendingAttachments((prev) => [
      ...prev,
      { id: tempId, type: 'image', uploading: true, url: null },
    ]);
    setImageUploading(true);
    try {
      const url = await uploadFile(file, 'avatar');
      console.log('[handlePickImage] uploaded url:', url);
      setPendingAttachments((prev) =>
        prev.map((a) => (a.id === tempId ? { ...a, uploading: false, url } : a))
      );
    } catch (err) {
      console.error("uploadFile (chat image) error:", err);
      // Xóa placeholder nếu upload thất bại
      setPendingAttachments((prev) => prev.filter((a) => a.id !== tempId));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSend = async () => {
    if (!activeGroup) return;

    const text = input.trim();
    if (!text && pendingAttachments.length === 0) return;
    // Không gửi nếu còn ảnh đang upload
    if (pendingAttachments.some((a) => a.uploading)) return;

    console.log('[handleSend] pendingAttachments:', pendingAttachments);

    const tempId = `temp_${Date.now()}`;
    const now = new Date();

    // Xác định type hiển thị cho optimistic message (ưu tiên place > image > text)
    const hasPlace = pendingAttachments.some((a) => a.type === 'place');
    const hasImage = pendingAttachments.some((a) => a.type === 'image');
    let msgType = "text";
    if (hasPlace) msgType = "place";
    else if (hasImage) msgType = "image";

    // Build attachments array cho API
    const apiAttachments = pendingAttachments.map((a) => {
      if (a.type === 'image') {
        return { type: 'image', value: a.url };
      } else {
        return {
          type: 'place',
          value: a.propertyToken ?? a.name,
          metadata: { name: a.name, address: a.address, gps: a.gps },
        };
      }
    });

    const optimisticMsg = {
      id: tempId,
      sender: "Me",
      avatar: "ME",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateKey: now.toLocaleDateString('sv-SE'),
      isMine: true,
      seen: false,
      type: msgType,
      text: text,
      // Backward compat: lấy item đầu tiên cho các field đơn lẻ
      placeName: hasPlace ? pendingAttachments.find((a) => a.type === 'place')?.name : undefined,
      url: hasImage ? pendingAttachments.find((a) => a.type === 'image')?.url : null,
      placeId: hasPlace ? (pendingAttachments.find((a) => a.type === 'place')?.address ?? pendingAttachments.find((a) => a.type === 'place')?.propertyToken ?? "") : undefined,
      attachments: apiAttachments,
    };

    // Snapshot pending trước khi clear
    const attachmentsToSend = [...pendingAttachments];

    // Optimistic update + clear input
    const updatedMessages = [...messages, optimisticMsg];
    setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: updatedMessages }));
    setInput("");
    setPendingAttachments([]);

    try {
      const apiPayload = {
        content: text || (hasPlace ? attachmentsToSend.find((a) => a.type === 'place')?.name : ''),
        ...(apiAttachments.length > 0 && { attachments: apiAttachments }),
      };

      const sentMsg = await sendMessage(activeGroup, apiPayload);
      const finalMsg = { ...optimisticMsg, id: sentMsg.id ?? tempId, seen: true };
      appendCachedMessage(activeGroup, finalMsg);
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: prev[activeGroup].map((m) => m.id === tempId ? finalMsg : m),
      }));

      // Gọi AI chỉ khi là tin nhắn text thuần (không có attachments)
      if (attachmentsToSend.length === 0 && text) {
        try {
          const payload = updatedMessages
            .filter((m) => m.type === "text" && m.text)
            .map((m) => ({ role: m.isMine ? "user" : "assistant", content: m.text }));

          const replyContent = await sendConversation(payload);
          if (replyContent) {
            // replyContent có thể là string hoặc object { answer, recommendations, ... }
            const isBotStructured = replyContent && typeof replyContent === 'object' && ('answer' in replyContent || 'recommendations' in replyContent);
            const botMsg = {
              id: Date.now() + 1,
              sender: "AI",
              avatar: "AI",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: isBotStructured ? (replyContent.answer ?? '') : replyContent,
              isMine: false,
              type: "text",
              isTyping: true,
              // Chatbot structured response
              ...(isBotStructured && {
                isChatbot: true,
                chatbotAnswer: replyContent.answer ?? '',
                chatbotRecommendations: replyContent.recommendations ?? [],
              }),
            };
            setMessagesByGroup((prev) => ({
              ...prev,
              [activeGroup]: [...(prev[activeGroup] ?? []), botMsg],
            }));
          }
        } catch (aiErr) {
          console.warn("AI reply failed (ignored):", aiErr.message);
        }
      }
    } catch (err) {
      console.error("handleSend error:", err);
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: prev[activeGroup].filter((m) => m.id !== tempId),
      }));
      // Khôi phục pending nếu gửi thất bại
      setPendingAttachments(attachmentsToSend);
    }
  };

  // ── Chọn địa điểm → lưu pending, chờ người dùng nhấn gửi ─────────────────
  const handlePickPlace = ({ name, address, propertyToken, gps }) => {
    if (!name) return;
    // Kiểm tra giới hạn tối đa
    if (pendingAttachments.length >= MAX_ATTACHMENTS) return;
    const id = `place_${Date.now()}_${Math.random()}`;
    setPendingAttachments((prev) => [
      ...prev,
      { id, type: 'place', name, address, propertyToken, gps },
    ]);
  };

  // handleSendPlace giữ lại để tương thích nếu cần gửi trực tiếp từ nơi khác
  const handleSendPlace = async ({ name, address, propertyToken, gps }) => {
    if (!activeGroup || !name) return;

    const tempId = `temp_place_${Date.now()}`;
    const now = new Date();
    const optimisticMsg = {
      id: tempId,
      sender: "Me",
      avatar: "ME",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateKey: now.toLocaleDateString("sv-SE"),
      isMine: true,
      seen: false,
      type: "place",
      text: "",
      placeName: name,
      placeId: address ?? propertyToken ?? "",
    };

    setMessagesByGroup((prev) => ({
      ...prev,
      [activeGroup]: [...(prev[activeGroup] ?? []), optimisticMsg],
    }));

    try {
      const apiPayload = {
        content: name,
        attachments: [
          {
            type: "place",
            value: propertyToken ?? name,
            metadata: { name, address, gps },
          },
        ],
      };
      const sentMsg = await sendMessage(activeGroup, apiPayload);
      const finalMsg = { ...optimisticMsg, id: sentMsg.id ?? tempId, seen: true };
      appendCachedMessage(activeGroup, finalMsg);
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: prev[activeGroup].map((m) => (m.id === tempId ? finalMsg : m)),
      }));
    } catch (err) {
      console.error("handleSendPlace error:", err);
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: prev[activeGroup].filter((m) => m.id !== tempId),
      }));
    }
  };

  const handleDeleteMessage = async (msgId) => {
    // Optimistic
    setMessagesByGroup((prev) => ({
      ...prev,
      [activeGroup]: prev[activeGroup].filter((m) => m.id !== msgId),
    }));
    removeCachedMessage(activeGroup, msgId);
    try {
      await deleteMessage(activeGroup, msgId);
    } catch (err) {
      console.error("handleDeleteMessage error:", err);
    }
  };

  const handleAddMember = async (uid) => {
    // POST /conversations/{id}/members → backend tự gửi invitation cho user được mời.
    // Không cập nhật members list ngay vì user chưa accept — chờ Firestore listener
    // cập nhật khi user accept invitation.
    await addMembers(activeGroup, [uid]);
  };

  const handleRemoveMember = async (uid) => {
    // Optimistic: xóa khỏi UI ngay
    setMembersByGroup((prev) => ({
      ...prev,
      [activeGroup]: (prev[activeGroup] ?? []).filter((m) => m.uid !== uid),
    }));
    try {
      await removeMembers(activeGroup, [uid]);
    } catch (err) {
      console.error("handleRemoveMember error:", err);
      // Rollback: re-fetch từ Firestore nếu API thất bại
      try {
        const freshMembers = await getMembersFromFirestore(activeGroup);
        setMembersByGroup((prev) => ({ ...prev, [activeGroup]: freshMembers }));
      } catch (fetchErr) {
        console.warn('[handleRemoveMember] rollback fetch failed:', fetchErr.message);
      }
    }
  };

  const handleLeaveGroup = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !activeGroup) return;
    try {
      await removeMembers(activeGroup, [uid]);
      const remaining = groups.filter((g) => g.id !== activeGroup);
      setGroups(remaining);
      setMessagesByGroup((prev) => { const n = { ...prev }; delete n[activeGroup]; return n; });
      setMembersByGroup((prev) => { const n = { ...prev }; delete n[activeGroup]; return n; });
      setShowRightPanel(false);
      setInput("");
      if (remaining.length > 0) setActiveGroupState(remaining[0].id);
      else setActiveGroupState(null);
    } catch (err) {
      console.error("handleLeaveGroup error:", err);
    }
  };

  return {
    // State
    groups,
    activeGroup,
    messages,
    currentGroup,
    currentMembers,
    loading,
    error,
    input,
    setInput,
    showRightPanel,
    setShowRightPanel,
    showCreateModal,
    setShowCreateModal,
    showAttach,
    setShowAttach,
    pendingAttachments,
    setPendingAttachments,
    imageUploading,
    MAX_ATTACHMENTS,
    // Handlers
    setActiveGroup,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleSend,
    handleSendPlace,
    handlePickPlace,
    handlePickImage,
    handleDeleteMessage,
    handleAddMember,
    handleRemoveMember,
    handleLeaveGroup,
  };
}