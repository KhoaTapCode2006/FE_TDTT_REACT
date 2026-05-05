import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StayCard from '@/components/profile/StayCard';
import LoyaltyCard from '@/components/profile/LoyaltyCard';
import EmptyState from '@/components/profile/EmptyState';
import HotelPopup from '@/components/hotel/components/HotelPopup';
import Icon from '@/components/ui/Icon';
import { fetchStays, filterByStatus, sortByDate } from '@/services/profile/stays.service';

/**
 * MyStaysPage Component
 * Display user's booking history with filtering and sorting
 */
const MyStaysPage = () => {
  const { user } = useAuth();
  const [stays, setStays] = useState([]);
  const [filteredStays, setFilteredStays] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStay, setSelectedStay] = useState(null);
  const [showHotelPopup, setShowHotelPopup] = useState(false);

  // Fetch stays on component mount
  useEffect(() => {
    const loadStays = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        setError(null);
        const fetchedStays = await fetchStays(user.uid);
        setStays(fetchedStays);
        setFilteredStays(fetchedStays);
      } catch (err) {
        console.error('Error loading stays:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStays();
  }, [user?.uid]);

  // Filter and sort stays when filter changes
  useEffect(() => {
    let filtered = filterByStatus(stays, activeFilter);
    
    // Sort based on status
    if (activeFilter === 'upcoming' || activeFilter === 'all') {
      // Sort upcoming stays by check-in date ascending
      const upcoming = filtered.filter(s => s.status === 'upcoming');
      const sorted = sortByDate(upcoming, 'asc', 'checkIn');
      
      if (activeFilter === 'all') {
        // For 'all', also include completed stays sorted by check-out descending
        const completed = filtered.filter(s => s.status === 'completed');
        const sortedCompleted = sortByDate(completed, 'desc', 'checkOut');
        filtered = [...sorted, ...sortedCompleted];
      } else {
        filtered = sorted;
      }
    } else if (activeFilter === 'completed') {
      // Sort completed stays by check-out date descending
      filtered = sortByDate(filtered, 'desc', 'checkOut');
    }
    
    setFilteredStays(filtered);
  }, [stays, activeFilter]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleViewDetails = (stay) => {
    setSelectedStay(stay);
    setShowHotelPopup(true);
  };

  const handleClosePopup = () => {
    setShowHotelPopup(false);
    setSelectedStay(null);
  };

  const handleRetry = () => {
    setError(null);
    if (user?.uid) {
      fetchStays(user.uid)
        .then(fetchedStays => {
          setStays(fetchedStays);
          setFilteredStays(fetchedStays);
        })
        .catch(err => {
          console.error('Error retrying:', err);
          setError(err.message);
        });
    }
  };

  const filters = [
    { id: 'all', label: 'All Stays', count: stays.length },
    { id: 'upcoming', label: 'Upcoming', count: stays.filter(s => s.status === 'upcoming').length },
    { id: 'completed', label: 'Completed', count: stays.filter(s => s.status === 'completed').length },
  ];

  const completedStaysCount = stays.filter(s => s.status === 'completed').length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ProfileSidebar activeItem="mystays" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <div className="mb-8">
            <ProfileHeader />
          </div>

          {/* Loyalty Card */}
          <div className="mb-8">
            <LoyaltyCard user={user} staysCount={completedStaysCount} />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button className="flex items-center gap-4 p-4 bg-white rounded-xl border border-outline-variant/20 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="credit_card" size={24} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-on-surface">Payment Methods</p>
                <p className="text-xs text-on-surface-variant">Manage your cards</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 bg-white rounded-xl border border-outline-variant/20 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <Icon name="support_agent" size={24} className="text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-on-surface">Concierge Chat</p>
                <p className="text-xs text-on-surface-variant">24/7 support</p>
              </div>
            </button>
          </div>

          {/* Stays Section */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-2xl text-on-surface">
                My Stays
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {filter.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === filter.id
                      ? 'bg-white/20'
                      : 'bg-surface-container'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-on-surface-variant">Loading your stays...</p>
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

            {/* Stays List */}
            {!loading && !error && (
              <>
                {filteredStays.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStays.map((stay) => (
                      <StayCard
                        key={stay.id}
                        stay={stay}
                        variant={stay.status === 'upcoming' ? 'expanded' : 'compact'}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="hotel"
                    title="No stays found"
                    description={
                      activeFilter === 'all'
                        ? "You haven't booked any stays yet. Start exploring and book your next adventure!"
                        : `You don't have any ${activeFilter} stays.`
                    }
                    actionLabel="Book New Stay"
                    onAction={() => window.location.href = '/'}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Hotel Popup */}
      {showHotelPopup && selectedStay?.hotelData && (
        <HotelPopup
          hotel={selectedStay.hotelData}
          bookingDates={{
            checkIn: selectedStay.checkIn,
            checkOut: selectedStay.checkOut
          }}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default MyStaysPage;
