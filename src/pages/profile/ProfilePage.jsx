import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import InfoSection from '@/components/profile/InfoSection';
import FavoritesSection from '@/components/profile/FavoritesSection';
import EditInfoModal from '@/components/profile/EditInfoModal';
import Icon from '@/components/ui/Icon';
import { profileService } from '@/services/profile/profile.service';

/**
 * ProfilePage Component
 * Main profile page for authenticated users
 * Displays personal information, favorites, and social links
 */
const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /**
   * Fetch profile data from Firestore
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
        // Profile doesn't exist, create a new one with basic info from auth user
        console.log('Profile not found, creating new profile...');
        try {
          const newProfile = await profileService.createProfile(user.uid, {
            email: user.email,
            fullName: user.displayName || '',
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
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  const handleEditProfile = () => {
    console.log('📝 handleEditProfile called in ProfilePage');
    console.log('Current isEditModalOpen:', isEditModalOpen);
    console.log('Current profileData:', profileData);
    
    setIsEditModalOpen(true);
    console.log('✅ Set isEditModalOpen to true');
  };

  /**
   * Handle profile update from EditInfoModal
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.4, 10.5
   */
  const handleProfileUpdate = async (updatedData) => {
    console.log('🔄 handleProfileUpdate called');
    console.log('User UID:', user?.uid);
    console.log('Updated data:', updatedData);
    
    if (!user?.uid) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      console.log('📤 Calling profileService.updateProfile...');
      
      // Call profileService.updateProfile with uid and updated data
      // Requirement 10.4: Use updateProfile method from profileService
      const updatedProfile = await profileService.updateProfile(user.uid, updatedData);
      
      console.log('✅ Profile updated successfully:', updatedProfile);
      
      // Update local state after successful save
      // Requirement 3.2: Update local profileData state
      setProfileData(updatedProfile);
      
      // Close modal on successful save
      // Requirement 3.5: Close modal after successful save
      setIsEditModalOpen(false);
      
      // Return success (no error thrown means success)
      return updatedProfile;
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Re-throw error to be handled by EditInfoModal
      // Requirement 3.3: Handle validation errors
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ProfileSidebar activeItem="profile" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <div className="mb-8">
            <ProfileHeader onEdit={handleEditProfile} />
          </div>

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
            <div className="space-y-6">
              {/* Personal Information Section */}
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

              {/* Favorites Section */}
              <FavoritesSection 
                userId={user?.uid}
              />

              {/* Social Links Section - Placeholder */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-headline font-bold text-2xl text-on-surface">
                    Social Links
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors">
                    <Icon name="add" size={18} />
                    Add Link
                  </button>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="link" size={32} className="text-on-surface-variant" />
                  </div>
                  <p className="text-on-surface-variant text-sm">
                    No social links added yet. Connect your social media profiles!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
