import { useState } from "react";
import { uploadFile } from "../../../services/backend/upload.service";

// ─── GroupForm ─────────────────────────────────────────────────────────────────
//Form dùng chung cho cả tạo mới lẫn cập nhật nhóm. 
// Xử lý: upload và preview ảnh thumbnail, validate tên nhóm (3–32 ký tự), nhập mô tả tùy chọn. 
// Nhận initialName/initialDescription và submitLabel làm props để tái sử dụng linh hoạt.

function GroupForm({ initialName = "", initialDescription = "", initialThumbnailUrl = "", submitLabel = "Lưu", onSubmit, onClose }) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialThumbnailUrl || null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const nameValid = name.trim().length >= 3 && name.trim().length <= 32;

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameValid) return;

    let thumbnailUrl = undefined;

    if (thumbnailFile) {
      try {
        setUploading(true);
        setUploadError(null);
        thumbnailUrl = await uploadFile(thumbnailFile, 'avatar');
      } catch (err) {
        setUploadError("Upload ảnh thất bại, thử lại.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else {
      // Giữ lại URL cũ nếu không chọn ảnh mới
      thumbnailUrl = initialThumbnailUrl || undefined;
    }

    onSubmit({ name: name.trim(), description: description.trim(), thumbnailUrl });
    onClose();
  };

  return (
    <>
      {/* Thumbnail preview */}
      <div className="flex justify-center">
        <label className="cursor-pointer group relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-primary transition-colors flex items-center justify-center bg-gray-50">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl text-gray-300">📷</span>
                <span className="text-xs text-gray-400">Ảnh nhóm</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
        </label>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Tên nhóm <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Chuyến đi Đà Lạt 2025"
            minLength={3}
            maxLength={32}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
              name.trim().length > 0 && !nameValid
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-primary"
            }`}
          />
          <div className="flex items-center justify-between">
            {name.trim().length > 0 && !nameValid && (
              <p className="text-xs text-red-400">Tên nhóm phải từ 3–32 ký tự</p>
            )}
            <span className={`text-xs ml-auto ${name.trim().length > 32 ? "text-red-400" : "text-gray-400"}`}>
              {name.trim().length}/32
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Mô tả <span className="text-gray-400 font-normal normal-case">(tùy chọn)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về nhóm..."
            maxLength={512}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
          />
          <span className="text-xs text-gray-400 text-right">{description.length}/512</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!nameValid || uploading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang upload...
              </>
            ) : submitLabel}
          </button>
        </div>
        {uploadError && (
          <p className="text-xs text-red-500 text-center -mt-2">{uploadError}</p>
        )}
      </form>
    </>
  );
}

export default GroupForm;