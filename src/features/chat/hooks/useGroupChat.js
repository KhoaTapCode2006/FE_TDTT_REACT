// ─── useGroupChat ──────────────────────────────────────────────────────────────
// Quản lý mọi state (danh sách nhóm, tin nhắn, members, UI toggles) 
// và xử lý toàn bộ business logic: load dữ liệu ban đầu, tạo/sửa/xóa nhóm, gửi tin nhắn (bao gồm gọi AI qua sendConversation), thêm/xóa member.

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../config/firebase";
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
  // Ảnh đã upload, chờ gửi cùng tin nhắn: { url: string, file: File } | null
  const [pendingImage, setPendingImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

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

        setGroups(groupList);
        setMembersByGroup(membersMap);
        setMessagesByGroup(messagesMap);

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
  useEffect(() => {
    // Không dùng `loading` làm guard vì Firestore onSnapshot fire ngay lập tức
    // trước khi loading=false, dẫn đến bỏ sót event.
    // Thay vào đó, track các IDs đã biết để chỉ xử lý IDs thực sự mới.
    let knownIds = new Set();
    let initialized = false;

    const unsub = subscribeToConversationIds(async (ids) => {
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

      if (newIds.length === 0) return;

      console.log('[subscribeToConversationIds] new group IDs:', newIds);

      // Fetch conversation + members cho các group mới
      const results = await Promise.allSettled(
        newIds.map((id) => getConversationFromFirestorePublic(id))
      );

      const newGroups = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);

      if (newGroups.length === 0) return;

      console.log('[subscribeToConversationIds] fetched new groups:', newGroups.map((g) => g.id));

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
            console.log('[subscribeToConversationIds] members for', g.id, ':', freshMembers.length);
            setMembersByGroup((prev) => ({
              ...prev,
              [g.id]: freshMembers.length > 0 ? freshMembers : (prev[g.id] ?? g.members),
            }));
          } catch (err) {
            console.warn('[subscribeToConversationIds] getMembersFromAPI failed for', g.id, err.message);
            setMembersByGroup((prev) => ({ ...prev, [g.id]: prev[g.id] ?? g.members }));
          }
        })
      );
    });

    return () => unsub();
  }, []); // Chạy một lần duy nhất khi mount
  // ── Real-time listener cho messages và members của activeGroup ──────────────
  useEffect(() => {
    if (!activeGroup) return;

    const unsubMessages = subscribeToMessages(activeGroup, (newMessages) => {
      setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: newMessages }));
    });

    const unsubMembers = subscribeToMembers(activeGroup, (newMembers) => {
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
    } catch (err) {
      console.error("handleLeaveGroup error:", err);
    }
  };

  // ── Chọn ảnh → upload ngay, lưu pending ────────────────────────────────────
  const handlePickImage = async (file) => {
    if (!file || !activeGroup) return;
    setImageUploading(true);
    try {
      const url = await uploadFile(file, 'avatar');
      console.log('[handlePickImage] uploaded url:', url);
      setPendingImage({ url, file });
    } catch (err) {
      console.error("uploadFile (chat image) error:", err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSend = async () => {
    if (!activeGroup) return;

    const text = input.trim();
    if (!text && !pendingImage) return;

    console.log('[handleSend] pendingImage:', pendingImage);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "Me",
      avatar: "ME",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMine: true,
      seen: false,
      type: pendingImage ? "image" : "text",
      text: text || "",
      url: pendingImage?.url ?? null,
      attachments: pendingImage ? [{ type: "image", value: pendingImage.url }] : [],
    };

    // Snapshot pending trước khi clear
    const imageToSend = pendingImage;

    // Optimistic update + clear input
    const updatedMessages = [...messages, optimisticMsg];
    setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: updatedMessages }));
    setInput("");
    setPendingImage(null);

    try {
      const apiPayload = {
        content: text,
      };
      if (imageToSend) {
        apiPayload.attachments = [{ type: "image", value: imageToSend.url }];
      }

      const sentMsg = await sendMessage(activeGroup, apiPayload);
      const finalMsg = { ...optimisticMsg, id: sentMsg.id ?? tempId, seen: true };
      appendCachedMessage(activeGroup, finalMsg);
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: prev[activeGroup].map((m) => m.id === tempId ? finalMsg : m),
      }));

      // Gọi AI chỉ khi là tin nhắn text thuần
      if (!imageToSend && text) {
        try {
          const payload = updatedMessages
            .filter((m) => m.type === "text" && m.text)
            .map((m) => ({ role: m.isMine ? "user" : "assistant", content: m.text }));

          const replyContent = await sendConversation(payload);
          if (replyContent) {
            const botMsg = {
              id: Date.now() + 1,
              sender: "AI",
              avatar: "AI",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: replyContent,
              isMine: false,
              type: "text",
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
      // Khôi phục pending image nếu gửi thất bại
      if (imageToSend) setPendingImage(imageToSend);
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
    try {
      await addMembers(activeGroup, [uid]);
      // Gọi API lấy danh sách members mới nhất (có đầy đủ display_name, avatar_url)
      const freshMembers = await getMembersFromAPI(activeGroup);
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: freshMembers }));
    } catch (err) {
      console.error("handleAddMember error:", err);
    }
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
    pendingImage,
    setPendingImage,
    imageUploading,
    // Handlers
    setActiveGroup,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleSend,
    handlePickImage,
    handleDeleteMessage,
    handleAddMember,
    handleRemoveMember,
    handleLeaveGroup,
  };
}