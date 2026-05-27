import { useAuth } from '@/contexts/AuthContext';
import FavoritesSection from '@/components/profile/FavoritesSection';

/**
 * LikedPlacesPage Component
 * Page displaying user's liked/favorited places
 * Requirements: 15.5, 15.6, 15.7, 15.8
 */
const LikedPlacesPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-headline font-bold text-3xl text-on-surface mb-2">
              Liked Places
            </h1>
            <p className="text-on-surface-variant">
              Your favorite hotels and places you've saved
            </p>
          </div>

          {/* Favorites Section */}
          {isAuthenticated ? (
            <FavoritesSection />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-on-surface-variant mb-4">
                Bạn phải đăng nhập để lưu các địa điểm yêu thích
              </p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default LikedPlacesPage;
