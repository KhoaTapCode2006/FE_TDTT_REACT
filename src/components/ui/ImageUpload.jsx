import { useState, useRef } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * ImageUpload Component
 * 
 * A drag-and-drop file upload component for images
 * 
 * @param {Object} props
 * @param {Function} props.onUpload - Callback when upload completes (receives public URL)
 * @param {Function} props.onError - Callback when upload fails (receives error message)
 * @param {boolean} props.disabled - Whether upload is disabled
 * @param {string} props.currentImageUrl - Current image URL to display
 * @param {string} props.category - Upload category (avatar, collection_cover, generic)
 */
export default function ImageUpload({ 
  onUpload, 
  onError, 
  disabled = false, 
  currentImageUrl = '',
  category = 'collection_cover'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      onError?.('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.('Kích thước file vượt quá 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Dynamic import to avoid circular dependencies
      const { uploadService } = await import('@/services/backend/upload.service');
      const publicUrl = await uploadService.uploadFile(file, category);
      onUpload?.(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle specific error types
      if (error.code === 'AUTH_ERROR' || error.code === 'AUTH_TOKEN_ERROR') {
        onError?.('Vui lòng đăng nhập để tải ảnh lên');
      } else if (error.statusCode === 400) {
        onError?.(error.message || 'Yêu cầu không hợp lệ');
      } else if (error.statusCode === 413) {
        onError?.('File quá lớn');
      } else if (error.code === 'NETWORK_ERROR') {
        onError?.('Không thể kết nối. Vui lòng thử lại');
      } else {
        onError?.(error.message || 'Tải ảnh lên thất bại. Vui lòng thử lại');
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    // CRITICAL: Use e.target.files[0] directly, don't wait for state
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area - Using label for native click handling */}
      <label
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center
          rounded-3xl border-2 border-dashed transition-all
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-outline-variant/50 bg-surface-container hover:border-primary/50 hover:bg-surface-container-high'
          }
          ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Chọn file ảnh"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium text-on-surface">Đang tải lên...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Icon name="cloud_upload" size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Kéo thả ảnh vào đây hoặc nhấn để chọn
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                JPEG, PNG, WebP, GIF (tối đa 10MB)
              </p>
            </div>
          </div>
        )}
      </label>

      {/* Current Image Preview */}
      {currentImageUrl && !isUploading && (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-3">
          <p className="mb-2 text-xs font-medium text-on-surface-variant">Ảnh hiện tại:</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-container">
            <img
              src={currentImageUrl}
              alt="Current thumbnail"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
