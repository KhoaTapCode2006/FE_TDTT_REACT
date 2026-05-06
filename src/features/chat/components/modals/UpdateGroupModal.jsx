import GroupForm from "../GroupForm";

// ─── Update Group Modal ───────────────────────────────────────────────────────
// Modal chỉnh sửa nhóm đã có. 
// Wrapper mỏng bọc GroupForm với dữ liệu nhóm hiện tại điền sẵn vào form và label "Lưu thay đổi".
function UpdateGroupModal({ groupName, groupDescription, groupId, onClose, onUpdate }) {
  const handleUpdate = ({ name, description, thumbnailUrl }) => {
    onUpdate({ id: groupId, name, description, thumbnailUrl });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Cập nhật nhóm</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          <GroupForm
            initialName={groupName}
            initialDescription={groupDescription ?? ""}
            submitLabel="Lưu thay đổi"
            onSubmit={handleUpdate}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}

export default UpdateGroupModal;