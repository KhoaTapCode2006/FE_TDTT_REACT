import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import CollectionCard from '@/components/collection/CollectionCard';
import EmptyState from '@/components/profile/EmptyState';
import Icon from '@/components/ui/Icon';
import { likedCollectionsService } from '@/services/profile/likedCollections.service';

/**
 * LikedCollectionsPage Component
 * Display and manage user's liked collections
 */
const LikedCollectionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch liked collections on component mount
  useEffect(() => {
    loadLikedCollections();
  }, []);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  /**
   * Load liked collections from backend
   */
  const loadLikedCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCollections = await likedCollectionsService.getLikedCollections();
      setCollections(fetchedCollections);
    } catch (err) {
      console.error('Error loading liked collections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle like/unlike collection
   */
  const handleLikeCollection = async (collectionId, shouldLike) => {
    // Store previous state for rollback
    const previousCollections = [...collections];
    const collection = collections.find(c => c.id === collectionId);

    // Optimistic update - remove from list immediately when unliking
    if (!shouldLike) {
      setCollections(collections.filter(c => c.id !== collectionId));
    }

    try {
      if (shouldLike) {
        await likedCollectionsService.likeCollection(collectionId);
        // Show success notification
        setNotification({
          type: 'success',
          message: 'Collection liked successfully!',
        });
      } else {
        await likedCollectionsService.unlikeCollection(collectionId);
        // Show success notification
        setNotification({
          type: 'success',
          message: `Unliked "${collection?.name || 'collection'}" successfully!`,
        });
      }
    } catch (err) {
      console.error('Error liking/unliking collection:', err);
      
      // Rollback on failure
      setCollections(previousCollections);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: err.message || `Failed to ${shouldLike ? 'like' : 'unlike'} collection. Please try again.`,
      });
    }
  };

  /**
   * Handle view collection - navigate to collection detail page
   */
  const handleViewCollection = (collection) => {
    navigate(`/collections/${collection.id}`, { 
      state: { returnTab: 'liked-collections' } 
    });
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    loadLikedCollections();
  };

  /**
   * Navigate to collections dashboard
   */
  const handleBrowseCollections = () => {
    navigate('/collections');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ProfileSidebar activeItem="likedcollections" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-headline font-bold text-3xl text-on-surface mb-2">
                  Liked Collections
                </h1>
                <p className="text-base text-on-surface-variant">
                  Collections you've saved for later
                </p>
              </div>
              
              {/* Browse Collections Button */}
              {!loading && collections.length > 0 && (
                <button
                  onClick={handleBrowseCollections}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
                >
                  <Icon name="explore" size={20} />
                  Browse Collections
                </button>
              )}
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-6 ${
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

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-on-surface-variant">Loading your liked collections...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <Icon name="error_outline" size={18} className="text-red-500 flex-none" />
              <p className="text-red-600 text-sm flex-1">{error}</p>
              <button
                onClick={handleRetry}
                className="text-red-600 font-semibold text-sm hover:text-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Collections Content */}
          {!loading && !error && (
            <>
              {collections.length > 0 ? (
                <>
                  {/* Collections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {collections.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        isOwner={user?.uid === collection.owner_uid}
                        showActions={true}
                        returnTab="liked-collections"
                        currentUserId={user?.uid}
                        isLiked={true}
                        onLike={handleLikeCollection}
                        showLikeButton={true}
                      />
                    ))}
                  </div>

                  {/* Tips Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-none">
                        <Icon name="lightbulb" size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-on-surface mb-2">
                          Tips for Managing Liked Collections
                        </h3>
                        <ul className="space-y-2 text-sm text-on-surface-variant">
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Like collections while browsing to save them for later</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Click on any collection to view all places and details</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Unlike collections you're no longer interested in to keep your list organized</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <EmptyState
                  icon="favorite_border"
                  title="No liked collections yet"
                  description="Start exploring collections and like the ones you want to save. You can find collections in the Collections page."
                  actionLabel="Browse Collections"
                  onAction={handleBrowseCollections}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LikedCollectionsPage;
