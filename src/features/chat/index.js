// ─── Chat Feature — Public API ─────────────────────────────────────────────────
// Import mọi thứ liên quan đến chat qua file này để tránh import path dài.

export { default as Avatar } from "./components/Avatar";
export { default as Sidebar } from "./components/Sidebar";
export { default as ChatHeader } from "./components/ChatHeader";
export { default as ChatArea } from "./components/ChatArea";
export { default as MessageBubble } from "./components/MessageBubble";
export { default as RightPanel } from "./components/RightPanel";
export { default as GroupForm } from "./components/GroupForm";
export { default as CreateGroupModal } from "./components/modals/CreateGroupModal";
export { default as UpdateGroupModal } from "./components/modals/UpdateGroupModal";
export { default as AddMemberModal } from "./components/modals/AddMemberModal";
export { useGroupChat } from "./hooks/useGroupChat";