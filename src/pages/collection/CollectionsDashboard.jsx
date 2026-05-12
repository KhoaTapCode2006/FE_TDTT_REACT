import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import CollectionCard from '@/components/collection/CollectionCard';
import { collectionService } from '@/services/backend/collection.service';
import { viewsService } from '@/services/backend/views.service';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for Saved Collections (temporary until backend API is ready)
const MOCK_SAVED_COLLECTIONS = [
  {
    id: 'saved-mock-1',
    name: 'Khách sạn 5 sao Hà Nội',
    description: 'Tuyển tập các khách sạn 5 sao sang trọng nhất tại trung tâm Hà Nội, phù hợp cho chuyến công tác hoặc nghỉ dưỡng cao cấp.',
    thumbnail_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    visibility: 'public',
    owner_uid: 'user-123',
    saved_count: 245,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-20'),
    tags: ['luxury', 'hanoi', '5-star'],
    places: [],
    collaborators: [],
    savers: []
  },
  {
    id: 'saved-mock-2',
    name: 'Resort biển Đà Nẵng',
    description: 'Những resort view biển tuyệt đẹp tại Đà Nẵng, lý tưởng cho kỳ nghỉ gia đình hoặc tuần trăng mật.',
    thumbnail_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    visibility: 'public',
    owner_uid: 'user-456',
    saved_count: 189,
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-10'),
    tags: ['beach', 'danang', 'resort'],
    places: [],
    collaborators: [],
    savers: []
  },
  {
    id: 'saved-mock-3',
    name: 'Homestay Đà Lạt',
    description: 'Các homestay ấm cúng và độc đáo tại Đà Lạt, mang đến trải nghiệm gần gũi với thiên nhiên và văn hóa địa phương.',
    thumbnail_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
    visibility: 'public',
    owner_uid: 'user-789',
    saved_count: 312,
    created_at: new Date('2024-01-25'),
    updated_at: new Date('2024-02-05'),
    tags: ['homestay', 'dalat', 'nature'],
    places: [],
    collaborators: [],
    savers: []
  }
];

/**
 * CollectionsDashboard Component
 * Main dashboard for managing collections with three tabs:
 * - My Collections: User's own collections
 * - Global Collections: Public collections from other users
 * - Saved Collections: Collections saved/bookmarked by the user
 */
function CollectionsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Get initial tab from URL or default to 'my'
  const initialTab = searchParams.get('tab') || 'my';
  const [activeTab, setActiveTab] = useState(initialTab); // 'my', 'global', or 'saved'
  const [myCollections, setMyCollections] = useState([]);
  const [globalCollections, setGlobalCollections] = useState([]);
  const [savedCollections, setSavedCollections] = useState(MOCK_SAVED_COLLECTIONS); // Mock data for now
  const [savedCollectionIds, setSavedCollectionIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Global tab filters
  const [topType, setTopType] = useState('all_time'); // 'weekly' or 'all_time'
  const [globalPage, setGlobalPage] = useState(1);
  const [hasMoreGlobal, setHasMoreGlobal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  


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
    } else if (activeTab === 'global') {
      loadGlobalCollections(1, false);
    }
    // For 'saved' tab, we use mock data (no API call needed yet)
  }, [activeTab, loadMyCollections, loadGlobalCollections]);

  // Task 5.4: Force reload when navigating back from CollectionPage
  // Requirements: 5.1, 5.2, 5.3, 5.4
  useEffect(() => {
    // Detect navigation back from CollectionPage using location.state?.fromCollection
    // or detect any navigation change via location.key
    const isNavigatingBack = location.state?.fromCollection || location.key;
    
    if (isNavigatingBack) {
      console.log('Detected navigation back - force reloading collections');
      
      // Reload appropriate tab data based on activeTab state
      if (activeTab === 'my') {
        loadMyCollections();
      } else if (activeTab === 'global') {
        loadGlobalCollections(1, false);
      }
      // For 'saved' tab, mock data doesn't need reloading
    }
  }, [location.key, activeTab, loadMyCollections, loadGlobalCollections]); // Listen to location.key changes

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
    // Authentication check
    if (!user) {
      alert('Vui lòng đăng nhập để lưu collection.');
      return;
    }

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
      // Task 8.2: Enhanced error handling with specific messages
      console.error('Failed to save/unsave collection:', err);
      
      // Handle different error types with specific messages
      if (err.statusCode === 400) {
        alert(err.message || 'Thao tác không thành công.');
      } else if (err.statusCode === 403) {
        alert(err.message || 'Bạn không có quyền thực hiện thao tác này.');
      } else if (err.statusCode === 404) {
        alert('Collection không tồn tại.');
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('network') || err.message?.includes('Network')) {
        alert('Không thể kết nối. Vui lòng thử lại.');
      } else {
        alert(`Không thể ${shouldSave ? 'lưu' : 'bỏ lưu'} collection. Vui lòng thử lại.`);
      }
    } finally {
      setActionLoading(false);
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
  if (loading && (myCollections.length === 0 && globalCollections.length === 0 && activeTab !== 'saved')) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
          <span className="text-sm font-medium text-on-surface">Loading collections...</span>
        </div>
      </div>
    );
  }

  const currentCollections = activeTab === 'my' 
    ? myCollections 
    : activeTab === 'global' 
      ? globalCollections 
      : savedCollections;

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
                : activeTab === 'global'
                  ? 'Discover and save collections from the community'
                  : 'Your saved collections from other users'}
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

          <button
            onClick={() => handleTabChange('saved')}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'saved'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="bookmark" size={20} />
              Đã lưu
            </div>
            {activeTab === 'saved' && (
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

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="hourglass_top" size={32} className="text-primary animate-spin" />
          </div>
        ) : currentCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-surface-container p-6 mb-4">
              <Icon 
                name={activeTab === 'my' ? 'collections_bookmark' : activeTab === 'global' ? 'public' : 'bookmark'} 
                size={48} 
                className="text-on-surface-variant" 
              />
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-2">
              {activeTab === 'my' 
                ? 'No collections yet' 
                : activeTab === 'global' 
                  ? 'No public collections available'
                  : 'No saved collections yet'}
            </h3>
            <p className="text-sm text-on-surface-variant text-center max-w-md mb-6">
              {activeTab === 'my' 
                ? 'Create your first collection to start organizing your favorite places' 
                : activeTab === 'global'
                  ? 'Check back later for community collections'
                  : 'Save collections from the Global tab to see them here'}
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
                {...(activeTab === 'global' && {
                  onSave: handleSaveCollection,
                  isSaved: savedCollectionIds.has(collection.id)
                })}
                {...(activeTab === 'saved' && {
                  onSave: handleSaveCollection,
                  isSaved: true // All items in saved tab are saved by definition
                })}
                showActions={true}
                returnTab={activeTab}
                currentUserId={user?.uid}
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
