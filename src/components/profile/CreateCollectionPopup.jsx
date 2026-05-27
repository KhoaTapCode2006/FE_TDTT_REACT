import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import ImageUpload from '@/components/ui/ImageUpload';

/**
 * CreateCollectionPopup
 * A form panel (no backdrop) to be embedded inside other modals.
 * Props:
 * - onClose: function()
 * - onCreate: async function(collectionData) -> returns created collection
 */
const CreateCollectionPopup = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({ name: '', description: '', tags: '', visibility: 'private' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tags = formData.tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const collectionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags,
        visibility: formData.visibility,
        thumbnail_url: coverUrl || undefined
      };

      await onCreate(collectionData);
      // close handled by parent if desired
    } catch (err) {
      console.error('Create collection failed:', err);
      setError(err?.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-outline-variant">
        <h2 className="font-headline font-bold text-xl text-on-surface">Tạo Collection Mới</h2>
        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors" disabled={loading}>
          <Icon name="close" size={24} className="text-on-surface-variant" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Icon name="error" size={20} className="text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Tên bộ sưu tập *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Nhập tên collection"
            className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Mô tả (tuỳ chọn)"
            className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            disabled={loading}
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Ảnh đại diện (thumbnail)</label>
          <ImageUpload
            onUpload={(publicUrl) => setCoverUrl(publicUrl)}
            onError={(msg) => setError(msg)}
            disabled={loading}
            currentImageUrl={coverUrl}
            category="collection_cover"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="Nhập tags, cách nhau bằng dấu phẩy"
            className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <p className="text-xs text-on-surface-variant mt-1">Separate multiple tags with commas</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-3">Quyền truy cập</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="visibility" value="private" checked={formData.visibility === 'private'} onChange={(e) => handleInputChange('visibility', e.target.value)} className="w-4 h-4 text-primary" disabled={loading} />
              <span className="text-sm">Private</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="visibility" value="public" checked={formData.visibility === 'public'} onChange={(e) => handleInputChange('visibility', e.target.value)} className="w-4 h-4 text-primary" disabled={loading} />
              <span className="text-sm">Public</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-outline-variant rounded-lg" disabled={loading}>Hủy</button>
          <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-lg" disabled={loading || !formData.name.trim()}>
            {loading ? 'Đang tạo...' : 'Tạo bộ sưu tập'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCollectionPopup;
