import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/app/AppContext';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ListCard from '@/components/profile/ListCard';
import CreateListModal from '@/components/profile/CreateListModal';
import EmptyState from '@/components/profile/EmptyState';
import Icon from '@/components/ui/Icon';
import { 
  fetchSavedLists, 
  createList, 
  deleteList 
} from '@/services/profile/savedLists.service';

/**
 * SavedListsPage Component
 * Display and manage user's saved hotel lists
 */
const SavedListsPage = () => {
  const { user } = useAuth();
  const { setClusterHotels, setActiveHotel } = useApp();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch saved lists on component mount
  useEffect(() => {
    const loadLists = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        setError(null);
        const fetchedLists = await fetchSavedLists(user.uid);
        setLists(fetchedLists);
      } catch (err) {
        console.error('Error loading saved lists:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, [user?.uid]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateList = async (listData) => {
    try {
      const newList = await createList(user.uid, listData);
      setLists([newList, ...lists]);
      setNotification({
        type: 'success',
        message: `List "${newList.name}" created successfully!`,
      });
    } catch (err) {
      console.error('Error creating list:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await deleteList(user.uid, listId);
      const deletedList = lists.find(l => l.id === listId);
      setLists(lists.filter(l => l.id !== listId));
      setNotification({
        type: 'success',
        message: `List "${deletedList?.name}" deleted successfully!`,
      });
    } catch (err) {
      console.error('Error deleting list:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete list. Please try again.',
      });
    }
  };

  const handleViewList = (list) => {
    console.log('View list:', list);
    
    if (!list.hotels || list.hotels.length === 0) {
      setNotification({
        type: 'error',
        message: 'This list is empty. Add some hotels first!',
      });
      return;
    }

    // Convert saved hotel metadata to full hotel objects for popup display
    const fullHotels = list.hotels.map(hotel => ({
      id: hotel.hotelId,
      name: hotel.name,
      address: hotel.location,
      rating: hotel.rating || 0,
      pricePerNight: hotel.pricePerNight || 0,
      currency: hotel.currency || 'VND',
      images: hotel.image ? [hotel.image] : [],
      // Add minimal required fields for HotelPopup
      amenities: [],
      description: null,
      reviews: [],
      nearbyLandmarks: [],
    }));

    if (fullHotels.length === 1) {
      // Single hotel: Show HotelPopup directly
      setClusterHotels([fullHotels[0]]);
      setActiveHotel(fullHotels[0]);
    } else {
      // Multiple hotels: Show ClusterSplitView
      setClusterHotels(fullHotels);
      setActiveHotel(fullHotels[0]); // Set first hotel as active
    }
  };

  const handleRetry = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedLists = await fetchSavedLists(user.uid);
      setLists(fetchedLists);
    } catch (err) {
      console.error('Error retrying:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ProfileSidebar activeItem="savedlists" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-headline font-bold text-3xl text-on-surface mb-2">
                  Saved Lists
                </h1>
                <p className="text-base text-on-surface-variant">
                  Organize your favorite hotels into collections
                </p>
              </div>
              
              {/* Create New List Button */}
              {!loading && lists.length > 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
                >
                  <Icon name="add" size={20} />
                  Create New List
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
              <p className="text-on-surface-variant">Loading your lists...</p>
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

          {/* Lists Content */}
          {!loading && !error && (
            <>
              {lists.length > 0 ? (
                <>
                  {/* Lists Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {lists.map((list, index) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        variant={index === 0 ? 'featured' : 'standard'}
                        onViewList={handleViewList}
                        onDeleteList={handleDeleteList}
                      />
                    ))}

                    {/* AI Curate Card Placeholder */}
                    <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer group p-6">
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                          <Icon name="auto_awesome" size={32} className="text-white" />
                        </div>
                        <h3 className="font-semibold text-base text-on-surface mb-2">
                          AI Curated Lists
                        </h3>
                        <p className="text-sm text-on-surface-variant mb-4">
                          Let AI create personalized collections based on your preferences
                        </p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-none">
                        <Icon name="lightbulb" size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-on-surface mb-2">
                          Tips for Managing Your Lists
                        </h3>
                        <ul className="space-y-2 text-sm text-on-surface-variant">
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Create themed lists like "Beach Getaways" or "Business Travel"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Add hotels while browsing by clicking the save button</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size={16} className="text-blue-500 mt-0.5 flex-none" />
                            <span>Share your lists with friends and family for trip planning</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <EmptyState
                  icon="bookmark"
                  title="No saved lists yet"
                  description="Create your first list to start organizing your favorite hotels. You can add hotels to your lists while browsing."
                  actionLabel="Create Your First List"
                  onAction={() => setShowCreateModal(true)}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateList}
      />
    </div>
  );
};

export default SavedListsPage;
