import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InfoSection from '@/components/profile/InfoSection';
import EditInfoModal from '@/components/profile/EditInfoModal';
import Icon from '@/components/ui/Icon';
import { profileService } from '@/services/profile/profile.service';
import FavoritesSection from '@/components/profile/FavoritesSection';
/**
 * InformationPage Component
 * User profile information page
 * Displays personal information and account details
 */
const InformationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /**
   * Fetch profile data
   */
  const fetchProfileData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await profileService.getProfile(user.uid);
      
      if (data) {
        setProfileData(data);
      } else {
        // Profile doesn't exist, create a new one
        console.log('Profile not found, creating new profile...');
        try {
          const newProfile = await profileService.createProfile(user.uid, {
            email: user.email,
            displayName: user.displayName || '',
            username: user.displayName || user.email?.split('@')[0] || '',
            avatar: user.photoURL ? { url: user.photoURL, provider: 'auth' } : null
          });
          setProfileData(newProfile);
        } catch (createErr) {
          console.error('Error creating profile:', createErr);
          setError('Failed to create profile. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.uid]);

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    fetchProfileData();
  };

  /**
   * Handle edit profile button click
   */
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  /**
   * Handle profile update from EditInfoModal
   */
  const handleProfileUpdate = async (updatedData) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedProfile = await profileService.updateProfile(user.uid, updatedData);
      setProfileData(updatedProfile);
      setIsEditModalOpen(false);
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  /**
   * Handle close modal
   */
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-on-surface-variant">Loading your profile...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <Icon name="error_outline" size={18} className="text-red-500 flex-none" />
              <p className="text-red-600 text-sm flex-1">{error}</p>
              <button
                onClick={handleRetry}
                className="text-red-600 font-semibold text-sm hover:text-red-700 mr-2"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-600 font-semibold text-sm hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Profile Content */}
          {!loading && !error && profileData && (
            <>
              {/* Information Section - Full Width */}
              <InfoSection 
                profileData={profileData} 
                onEdit={handleEditProfile}
                loading={loading}
              />

              {/* Edit Info Modal */}
              <EditInfoModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModal}
                profileData={profileData}
                onSave={handleProfileUpdate}
              />
            </>
          )}


          <FavoritesSection/>
        </div>
      </main>

    </div>
  );
};

export default InformationPage;
