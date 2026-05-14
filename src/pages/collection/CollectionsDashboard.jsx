import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import CollectionCard from '@/components/collection/CollectionCard';
import { collectionService } from '@/services/backend/collection.service';
import { viewsService } from '@/services/backend/views.service';
import { likedCollectionsService } from '@/services/profile/likedCollections.service';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Get initial tab from URL or default to 'my'
  const initialTab = searchParams.get('tab') || 'my';
  const [activeTab, setActiveTab] = useState(initialTab); // 'my' or 'global'
  const [myCollections, setMyCollections] = useState([]);
  const [globalCollections, setGlobalCollections] = useState([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState(new Set());
  const [likedCollectionIds, setLikedCollectionIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Global tab filters
  const [topType, setTopType] = useState('all_time'); // 'weekly' or 'all_time'
  const [globalPage, setGlobalPage] = useState(1);
  const [hasMoreGlobal, setHasMoreGlobal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Track last load time to force refresh
  const [lastLoadTime, setLastLoadTime] = useState(Date.now());

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load liked collections on mount and when global collections change
  useEffect(() => {
    const updateLikedCollectionIds = () => {
      // For global collections, check the savers field
      if (activeTab === 'global' && globalCollections.length > 0) {
        const likedIds = new Set(
          globalCollections
            .filter(c => c.savers?.some(s => s.uid === user?.uid))
            .map(c => c.id)
        );
        setLikedCollectionIds(likedIds);
        console.log('📦 Updated liked collection IDs from global collections:', Array.from(likedIds));
      }
      
      // For my collections, check the savers field
      if (activeTab === 'my' && myCollections.length > 0) {
        const likedIds = new Set(
          myCollections
            .filter(c => c.savers?.some(s => s.uid === user?.uid))
            .map(c => c.id)
        );
        setLikedCollectionIds(likedIds);
        console.log('📦 Updated liked collection IDs from my collections:', Array.from(likedIds));
      }
    };

    if (user?.uid) {
      updateLikedCollectionIds();
    }
  }, [user?.uid, activeTab, globalCollections, myCollections]);

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

  // Load Global Collections using Views API + fallback to latest public collections
  const loadGlobalCollections = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const limit = 10;
      
      // Get top views collections
      const response = await viewsService.getTopCollections(topType, limit, page);
      
      // API returns data directly as array, not nested in items
      let collections = response.data || [];
      
      // If not enough collections from top views, fill with latest public collections
      if (collections.length < limit && page === 1) {
        try {
          const needed = limit - collections.length;
          
          // Get more collections from Views API (all_time with higher limit)
          const fallbackResponse = await viewsService.getTopCollections('all_time', 50, 1);
          const latestCollections = fallbackResponse.data || [];
          
          // Filter out collections already in top views
          const topViewIds = new Set(collections.map(c => c.id));
          const additionalCollections = latestCollections
            .filter(c => !topViewIds.has(c.id))
            .slice(0, needed);
          
          collections = [...collections, ...additionalCollections];
          
          console.log(`Added ${additionalCollections.length} latest collections to fill gap`);
        } catch (fallbackError) {
          console.error('Failed to load fallback collections:', fallbackError);
          // Continue with what we have from top views
        }
      }
      
      if (append) {
        setGlobalCollections(prev => [...prev, ...collections]);
      } else {
        setGlobalCollections(collections);
      }
      
      // Check if there are more pages (if we got full limit, assume there might be more)
      setHasMoreGlobal(collections.length >= limit);
      setGlobalPage(page);
      
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
      setLoadingMore(false);
    }
  }, [topType, user]);

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'my') {
      loadMyCollections();
    } else {
      loadGlobalCollections(1, false);
    }
  }, [activeTab, loadMyCollections, loadGlobalCollections]);

  // Force reload when navigating back to this page
  useEffect(() => {
    // Check if we're coming back from another page (location state will be set)
    const shouldReload = location.state?.fromCollection || location.key;
    
    if (shouldReload) {
      console.log('Detected navigation back - force reloading collections');
      setLastLoadTime(Date.now());
      
      // Reload based on active tab
      if (activeTab === 'my') {
        loadMyCollections();
      } else {
        loadGlobalCollections(1, false);
      }
    }
  }, [location.key]); // Trigger on location change

  // Reload global collections when topType changes
  useEffect(() => {
    if (activeTab === 'global') {
      loadGlobalCollections(1, false);
    }
  }, [topType]); // Only depend on topType, not loadGlobalCollections

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    // Update URL with tab parameter
    setSearchParams({ tab });
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

  // Handle like/unlike collection
  const handleLikeCollection = async (collectionId, shouldLike) => {
    try {
      if (shouldLike) {
        await likedCollectionsService.likeCollection(collectionId);
        // Only update state after successful API call
        setLikedCollectionIds(prev => new Set([...prev, collectionId]));
        setNotification({
          type: 'success',
          message: 'Collection liked successfully!',
        });
      } else {
        await likedCollectionsService.unlikeCollection(collectionId);
        // Only update state after successful API call
        setLikedCollectionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
        setNotification({
          type: 'success',
          message: 'Collection unliked successfully!',
        });
      }
    } catch (err) {
      console.error('Failed to like/unlike collection:', err);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: err.message || `Failed to ${shouldLike ? 'like' : 'unlike'} collection. Please try again.`,
      });
    }
  };

  // Handle load more for global collections
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreGlobal) {
      loadGlobalCollections(globalPage + 1, true);
    }
  };

  // Handle top type filter change
  const handleTopTypeChange = (newTopType) => {
    setTopType(newTopType);
    setGlobalPage(1);
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

        {/* Global Tab Filters */}
        {activeTab === 'global' && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
            <Icon name="filter_list" size={20} className="text-on-surface-variant" />
            <span className="text-sm font-medium text-on-surface-variant">Hiển thị:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleTopTypeChange('all_time')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  topType === 'all_time'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Thịnh hành nhất
              </button>
              <button
                onClick={() => handleTopTypeChange('weekly')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  topType === 'weekly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Xu hướng tuần
              </button>
            </div>
          </div>
        )}

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

        {/* Notification */}
        {notification && (
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <Icon
              name={notification.type === 'success' ? 'check_circle' : 'error_outline'}
              size={18}
              className={notification.type === 'success' ? 'text-green-500' : 'text-red-500'}
            />
            <p
              className={`text-sm flex-1 ${
                notification.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className={notification.type === 'success' ? 'text-green-600' : 'text-red-600'}
            >
              <Icon name="close" size={18} />
            </button>
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
                returnTab={activeTab}
                currentUserId={user?.uid}
                isLiked={likedCollectionIds.has(collection.id)}
                onLike={handleLikeCollection}
                showLikeButton={true}
              />
            ))}
          </div>
        )}

        {/* Load More Button (Global Tab Only) */}
        {activeTab === 'global' && !loading && currentCollections.length > 0 && hasMoreGlobal && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Icon name="hourglass_top" size={20} className="animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Icon name="expand_more" size={20} />
                  Xem thêm
                </>
              )}
            </button>
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
