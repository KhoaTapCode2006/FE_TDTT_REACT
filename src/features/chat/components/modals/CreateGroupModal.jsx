import GroupForm from "../GroupForm";

// ─── Create Group Modal ───────────────────────────────────────────────────────
// Modal tạo nhóm mới. Wrapper mỏng bọc GroupForm với giá trị khởi tạo rỗng và label "Tạo nhóm".
function CreateGroupModal({ onClose, onCreate }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Tạo nhóm mới</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          <GroupForm
            initialName=""
            initialDescription=""
            submitLabel="Tạo nhóm"
            onSubmit={onCreate}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}

export default CreateGroupModal;