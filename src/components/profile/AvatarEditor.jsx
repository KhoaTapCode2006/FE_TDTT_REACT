import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Icon from '@/components/ui/Icon';

/**
 * AvatarEditor Component
 * Modal for uploading and cropping user avatar images
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6
 */
function AvatarEditor({ isOpen, onClose, onSave, currentAvatar }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
    aspect: 1
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Generate cropped image blob
  const getCroppedImageBlob = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !imgRef.current) {
        reject(new Error('No crop completed'));
        return;
      }

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to desired output size (300x300 for avatar)
      const outputSize = 300;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate crop dimensions
      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      // Draw cropped image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputSize,
        outputSize
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop]);

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const blob = await getCroppedImageBlob();
      await onSave(blob);

      // Reset state and close
      handleClose();
    } catch (err) {
      console.error('Error saving avatar:', err);
      setError(err.message || 'Failed to save avatar');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
      aspect: 1
    });
    setCompletedCrop(null);
    setError(null);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Avatar</h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <Icon name="error" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* File upload section */}
          {!imageSrc && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-2xl hover:border-primary transition-colors">
                <Icon name="cloud_upload" size={48} className="text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">Upload your avatar</p>
                <p className="text-sm text-gray-500 mb-4">JPG, PNG or GIF (max 5MB)</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:brightness-95 transition-all"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Current avatar preview */}
              {currentAvatar && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Current Avatar</p>
                  <img
                    src={currentAvatar}
                    alt="Current avatar"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
                  />
                </div>
              )}
            </div>
          )}

          {/* Crop section */}
          {imageSrc && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    className="max-w-full max-h-[400px] mx-auto"
                  />
                </ReactCrop>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setImageSrc(null);
                    setSelectedFile(null);
                    setCompletedCrop(null);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Choose Different Image
                </button>

                <p className="text-sm text-gray-600">
                  Drag to adjust the crop area
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!completedCrop || isSaving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="check" size={20} />
                Save Avatar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarEditor;
