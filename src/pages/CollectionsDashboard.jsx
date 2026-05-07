import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import CollectionCard from '@/components/collection/CollectionCard';
import { collectionService } from '@/services/backend/collection.service';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CollectionsDashboard Component
 * Main dashboard for managing collections with two tabs:
 * - My Collections: User's own collections
 * - Global Collections: Public collections from other users
 */
function CollectionsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'global'
  const [myCollections, setMyCollections] = useState([]);
  const [globalCollections, setGlobalCollections] = useState([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load My Collections
  const loadMyCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const collections = await collectionService.getMyCollections();
      setMyCollections(collections || []);
    } catch (err) {
      console.error('Failed to load my collections:', err);
      setError(err.message || 'Failed to load your collections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Global Collections
  const loadGlobalCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const collections = await collectionService.getGlobalCollections();
      setGlobalCollections(collections || []);
      
      // Extract saved collection IDs
      const savedIds = new Set(
        collections
          .filter(c => c.savers?.some(s => s.uid === user?.uid))
          .map(c => c.id)
      );
      setSavedCollectionIds(savedIds);
    } catch (err) {
      console.error('Failed to load global collections:', err);
      setError(err.message || 'Failed to load global collections');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'my') {
      loadMyCollections();
    } else {
      loadGlobalCollections();
    }
  }, [activeTab, loadMyCollections, loadGlobalCollections]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  // Handle delete collection
  const handleDeleteCollection = async (collectionId) => {
    setActionLoading(true);
    try {
      await collectionService.deleteCollection(collectionId);
      
      // Remove from local state
      setMyCollections(prev => prev.filter(c => c.id !== collectionId));
      
      // Show success message
      alert('Collection deleted successfully!');
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert(`Failed to delete collection: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle save/unsave collection
  const handleSaveCollection = async (collectionId, shouldSave) => {
    setActionLoading(true);
    try {
      if (shouldSave) {
        await collectionService.saveCollection(collectionId);
        setSavedCollectionIds(prev => new Set([...prev, collectionId]));
      } else {
        await collectionService.unsaveCollection(collectionId);
        setSavedCollectionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      }
      
      // Update saved_count in local state
      setGlobalCollections(prev => 
        prev.map(c => 
          c.id === collectionId 
            ? { ...c, saved_count: (c.saved_count || 0) + (shouldSave ? 1 : -1) }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to save/unsave collection:', err);
      alert(`Failed to ${shouldSave ? 'save' : 'unsave'} collection: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle create new collection
  const handleCreateCollection = () => {
    navigate('/collections/new');
  };

  // Render loading state
  if (loading && (myCollections.length === 0 && globalCollections.length === 0)) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
          <span className="text-sm font-medium text-on-surface">Loading collections...</span>
        </div>
      </div>
    );
  }

  const currentCollections = activeTab === 'my' ? myCollections : globalCollections;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Collections</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {activeTab === 'my' 
                ? 'Manage your personal collections of favorite places' 
                : 'Discover and save collections from the community'}
            </p>
          </div>

          {activeTab === 'my' && (
            <button
              onClick={handleCreateCollection}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              <Icon name="add" size={20} />
              Create Collection
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-outline-variant/30">
          <button
            onClick={() => handleTabChange('my')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'my'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="person" size={20} />
              My Collections
            </div>
            {activeTab === 'my' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('global')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'global'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="public" size={20} />
              Global Collections
            </div>
            {activeTab === 'global' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <Icon name="error" size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Error loading collections</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="hourglass_top" size={32} className="text-primary animate-spin" />
          </div>
        ) : currentCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-surface-container p-6 mb-4">
              <Icon 
                name={activeTab === 'my' ? 'collections_bookmark' : 'public'} 
                size={48} 
                className="text-on-surface-variant" 
              />
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-2">
              {activeTab === 'my' ? 'No collections yet' : 'No public collections available'}
            </h3>
            <p className="text-sm text-on-surface-variant text-center max-w-md mb-6">
              {activeTab === 'my' 
                ? 'Create your first collection to start organizing your favorite places' 
                : 'Check back later for community collections'}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={handleCreateCollection}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                <Icon name="add" size={20} />
                Create Your First Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isOwner={activeTab === 'my'}
                onDelete={handleDeleteCollection}
                onSave={handleSaveCollection}
                isSaved={savedCollectionIds.has(collection.id)}
                showActions={true}
              />
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-3xl bg-surface-container-low px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-on-surface">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsDashboard;
