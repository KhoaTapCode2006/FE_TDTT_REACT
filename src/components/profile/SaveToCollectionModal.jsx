import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import CollectionCard from '@/components/collection/CollectionCard';
import CreateCollectionPopup from '@/components/profile/CreateCollectionPopup';
import { collectionService } from '@/services/backend/collection.service';

/**
 * SaveToCollectionModal
 * - Fetches user's saved collections (GET /me/saved-collections)
 * - Shows them in a scrollable modal sized ~80% viewport
 * - Allows selecting one collection (round selector) and submitting
 * - On submit calls POST /collections/{id}/places via collectionService.addPlacesToCollection
 */
const SaveToCollectionModal = ({ isOpen, onClose, hotel }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load collections the user owns (GET /me/my-collections)
        const data = await collectionService.getMyOwnedCollections();
        if (!mounted) return;
        setCollections(data || []);
      } catch (err) {
        console.error('Failed to load user collections:', err);
        if (!mounted) return;
        setError('Không thể tải bộ sưu tập. Vui lòng thử lại.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setSuccess(null);
      setError(null);
    }
  }, [isOpen]);

  const placeId = hotel?.ref_id || hotel?.id || hotel?.propertyToken || hotel?.placeId;

  const handleSubmit = async () => {
    if (!selectedId) {
      setError('Vui lòng chọn bộ sưu tập');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      // Use POST /collections/{collection_id}/places to add the place to the collection
      await collectionService.addPlacesToCollection(selectedId, [placeId]);
      setSuccess('Đã thêm khách sạn vào bộ sưu tập');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to save collection for user:', err);
      setError('Không thể thêm vào bộ sưu tập. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleCreate = async (collectionData) => {
    // Create collection via API then add to local list and try adding current hotel
    const newCollection = await collectionService.createCollection(collectionData);
    setCollections(prev => [newCollection, ...(prev || [])]);
    // Try to add current hotel to newly created collection
    try {
      await collectionService.addPlacesToCollection(newCollection.id, [placeId]);
    } catch (err) {
      console.error('Failed to add hotel to newly created collection:', err);
    }
    return newCollection;
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[80vw] h-[80vh] max-w-[1200px] max-h-[900px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <div>
            <h2 className="text-xl font-bold text-primary">Chọn bộ sưu tập</h2>
            <p className="text-sm text-on-surface-variant mt-1">Lưu "{hotel?.name}" vào bộ sưu tập</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90"
            >
              Tạo Bộ Sưu Tập Mới
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <Icon name="close" size={20} className="text-on-surface-variant" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {collections.map((col) => (
                <div key={col.id} className="relative">
                  <div className="absolute -top-3 right-3 z-20">
                    <button
                      onClick={() => setSelectedId(col.id === selectedId ? null : col.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${selectedId === col.id ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-on-surface-variant'}`}
                      aria-pressed={selectedId === col.id}
                      title={selectedId === col.id ? 'Đã chọn' : 'Chọn bộ sưu tập này'}
                    >
                      {selectedId === col.id ? <Icon name="check" size={16} /> : <Icon name="radio_button_unchecked" size={16} />}
                    </button>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-2xl">
                    <CollectionCard collection={col} showActions={false} isSaved={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-end gap-3 bg-surface">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || submitting}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang lưu...' : 'Lưu vào bộ sưu tập'}
          </button>
        </div>
      </div>
    </div>
    {showCreateModal && (
      <div className="fixed inset-0 flex items-center justify-center p-6 z-[1060]">
        <div className="w-full max-w-[900px]">
          <CreateCollectionPopup
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              await handleCreate(data);
              setShowCreateModal(false);
            }}
          />
        </div>
      </div>
    )}
    </>
  );
};

export default SaveToCollectionModal;
