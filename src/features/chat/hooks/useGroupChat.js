// ─── useGroupChat ──────────────────────────────────────────────────────────────
// Quản lý mọi state (danh sách nhóm, tin nhắn, members, UI toggles) 
// và xử lý toàn bộ business logic: load dữ liệu ban đầu, tạo/sửa/xóa nhóm, gửi tin nhắn (bao gồm gọi AI qua sendConversation), thêm/xóa member.

import { useState, useEffect } from "react";
import {
  getGroups,
  getMembersByGroup,
  getMessagesByGroup,
  createConversation,
  updateConversation,
  deleteConversation,
  addMembers,
  removeMembers,
  sendMessage,
  deleteMessage,
  markAsRead,
  sendConversation,
} from "../../../services/backend/chat.service";

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

  // ── Load dữ liệu ban đầu ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const messages = messagesByGroup[activeGroup] ?? [];
  const currentGroup = groups.find((g) => g.id === activeGroup) ?? groups[0];
  const currentMembers = membersByGroup[activeGroup] ?? [];

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

  const handleDeleteGroup = async () => {
    try {
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

  const handleSend = async (attachment = null) => {
    if (!activeGroup) return;

    // ── Gửi attachment (image / video / file / place) ──
    if (attachment) {
      // Optimistic update trước
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        sender: "Me",
        avatar: "ME",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMine: true,
        seen: false,
        ...attachment,
      };
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroup]: [...(prev[activeGroup] ?? []), optimisticMsg],
      }));

      try {
        await sendMessage(activeGroup, {
          type: attachment.type,
          content: attachment.text ?? "",
          url: attachment.url ?? undefined,
          file_name: attachment.fileName ?? undefined,
          place_id: attachment.placeId ?? undefined,
        });
      } catch (err) {
        console.error("sendMessage (attachment) error:", err);
        // Rollback optimistic update nếu lỗi
        setMessagesByGroup((prev) => ({
          ...prev,
          [activeGroup]: prev[activeGroup].filter((m) => m.id !== tempId),
        }));
      }
      return;
    }

    // ── Gửi text + nhận AI reply ──
    const text = input.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "Me",
      avatar: "ME",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
      isMine: true,
      type: "text",
      seen: false,
    };

    const updatedMessages = [...messages, optimisticMsg];
    setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: updatedMessages }));
    setInput("");

    try {
      // Gửi tin nhắn lên backend
      await sendMessage(activeGroup, { type: "text", content: text });

      // Gọi AI — lỗi AI không ảnh hưởng đến tin nhắn đã gửi
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
        // AI không phản hồi — bỏ qua, tin nhắn của user vẫn giữ nguyên
        console.warn("AI reply failed (ignored):", aiErr.message);
      }
    } catch (err) {
      console.error("handleSend error:", err);
      // Rollback chỉ khi gửi tin nhắn thất bại
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
    try {
      await deleteMessage(activeGroup, msgId);
    } catch (err) {
      console.error("handleDeleteMessage error:", err);
      // Không rollback vì khó lấy lại message đã xóa — reload nếu cần
    }
  };

  const handleAddMember = async (uid) => {
    try {
      const updated = await addMembers(activeGroup, [uid]);
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: updated.members }));
    } catch (err) {
      console.error("handleAddMember error:", err);
    }
  };

  const handleRemoveMember = async (uid) => {
    try {
      const updated = await removeMembers(activeGroup, [uid]);
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: updated.members }));
    } catch (err) {
      console.error("handleRemoveMember error:", err);
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
    // Handlers
    setActiveGroup,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleSend,
    handleDeleteMessage,
    handleAddMember,
    handleRemoveMember,
  };
}