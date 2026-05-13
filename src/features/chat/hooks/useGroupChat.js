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

  // ── Chọn ảnh → upload ngay, lưu pending ────────────────────────────────────
  const handlePickImage = async (file) => {
    if (!file || !activeGroup) return;
    setImageUploading(true);
    try {
      const url = await uploadFile(file, 'chat');
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
    // Không có gì để gửi
    if (!text && !pendingImage) return;

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
        type: imageToSend ? "image" : "text",
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
      // Re-fetch từ Firestore subcollection vì backend response không trả về members
      const freshMembers = await getMembersFromFirestore(activeGroup);
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: freshMembers }));
    } catch (err) {
      console.error("handleAddMember error:", err);
    }
  };

  const handleRemoveMember = async (uid) => {
    try {
      await removeMembers(activeGroup, [uid]);
      // Re-fetch từ Firestore subcollection vì backend response không trả về members
      const freshMembers = await getMembersFromFirestore(activeGroup);
      setMembersByGroup((prev) => ({ ...prev, [activeGroup]: freshMembers }));
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
  };
}