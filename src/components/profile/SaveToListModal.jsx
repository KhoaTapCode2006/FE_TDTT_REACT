import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchSavedLists, 
  createList, 
  addHotelToList 
} from '@/services/profile/savedLists.service';
import Icon from '@/components/ui/Icon';

/**
 * SaveToListModal Component
 * Modal to save a hotel to user's saved lists
 */
const SaveToListModal = ({ isOpen, onClose, hotel }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadLists();
    }
  }, [isOpen, user]);

  const loadLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const userLists = await fetchSavedLists(user.uid);
      setLists(userLists);
    } catch (err) {
      console.error('Error loading lists:', err);
      setError('Không thể tải danh sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToList = async (listId) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Check if hotel already in list
      const list = lists.find(l => l.id === listId);
      if (list?.hotels?.some(h => h.id === hotel.id)) {
        setError('Khách sạn đã có trong danh sách này');
        return;
      }

      await addHotelToList(user.uid, listId, hotel);
      setSuccess('Đã thêm vào danh sách!');
      
      // Reload lists to update counts
      await loadLists();
      
      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving to list:', err);
      setError('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newListName.trim()) {
      setError('Vui lòng nhập tên danh sách');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Create new list
      const newList = await createList(user.uid, {
        name: newListName.trim(),
        description: newListDescription.trim() || null,
      });

      // Add hotel to new list
      await addHotelToList(user.uid, newList.id, hotel);
      
      setSuccess('Đã tạo danh sách và thêm khách sạn!');
      
      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Không thể tạo danh sách. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <div>
            <h2 className="text-xl font-bold text-primary">Lưu vào danh sách</h2>
            <p className="text-sm text-on-surface-variant mt-1">{hotel?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
          >
            <Icon name="close" size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <Icon name="error" size={18} className="text-red-500 flex-none" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <Icon name="check_circle" size={18} className="text-green-500 flex-none" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Lists */}
          {!loading && !showCreateNew && (
            <>
              {lists.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="bookmark_border" size={48} className="text-on-surface-variant/30 mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant mb-4">
                    Bạn chưa có danh sách nào
                  </p>
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors"
                  >
                    Tạo danh sách đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleSaveToList(list.id)}
                      disabled={saving || list.hotels?.some(h => h.id === hotel.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        list.hotels?.some(h => h.id === hotel.id)
                          ? 'border-green-300 bg-green-50 cursor-not-allowed'
                          : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon 
                              name={list.hotels?.some(h => h.id === hotel.id) ? "check_circle" : "bookmark_border"} 
                              size={20} 
                              className={list.hotels?.some(h => h.id === hotel.id) ? "text-green-500" : "text-primary"} 
                            />
                            <h3 className="font-semibold text-on-surface truncate">{list.name}</h3>
                          </div>
                          {list.description && (
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                              {list.description}
                            </p>
                          )}
                          <p className="text-xs text-on-surface-variant mt-1">
                            {list.hotels?.length || 0} khách sạn
                          </p>
                        </div>
                        {list.hotels?.some(h => h.id === hotel.id) && (
                          <span className="text-xs font-semibold text-green-600 ml-2">
                            Đã lưu
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Create New List Button */}
              {lists.length > 0 && (
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="w-full mt-4 p-4 border-2 border-dashed border-outline-variant rounded-xl hover:border-primary hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 text-primary font-semibold"
                >
                  <Icon name="add" size={20} />
                  Tạo danh sách mới
                </button>
              )}
            </>
          )}

          {/* Create New List Form */}
          {!loading && showCreateNew && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Tên danh sách *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ví dụ: Kỳ nghỉ hè 2024"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Thêm mô tả cho danh sách..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewListName('');
                    setNewListDescription('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateAndSave}
                  disabled={saving || !newListName.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  Tạo & Lưu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveToListModal;
