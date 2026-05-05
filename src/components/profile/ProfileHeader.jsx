import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';

/**
 * ProfileHeader Component
 * Display user profile information at the top of profile pages
 * 
 * @param {Object} props
 * @param {Object} props.user - User object (optional, defaults to AuthContext user)
 * @param {boolean} props.showActions - Show action buttons (default: true)
 * @param {Function} props.onEdit - Callback function when edit button is clicked
 */
const ProfileHeader = ({ user: propUser, showActions = true, onEdit }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const handleEditProfile = () => {
    console.log('🖱️ Edit Profile button clicked in ProfileHeader');
    console.log('onEdit prop:', onEdit);
    console.log('onEdit type:', typeof onEdit);
    
    if (onEdit) {
      console.log('✅ Calling onEdit handler');
      onEdit();
    } else {
      console.warn('⚠️ Edit profile clicked - no onEdit handler provided');
    }
  };

  const handleShareProfile = () => {
    // Placeholder for share profile functionality
    console.log('Share profile clicked');
    // TODO: Implement share functionality
  };

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 rounded-2xl overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTEyIDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek00OCAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden ring-4 ring-white/50">
              {user?.photoURL || user?.avatar?.url ? (
                <img
                  src={user.photoURL || user.avatar.url}
                  alt={user.displayName || user.fullName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="person" size={48} className="text-primary" />
              )}
            </div>
            
            {/* Verification Badge */}
            {user?.emailVerified && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-4 ring-white shadow-md">
                <Icon name="verified" size={18} className="text-white" variant="filled" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-headline font-bold text-2xl md:text-3xl text-on-surface mb-2">
              {user?.displayName || user?.fullName || user?.username || 'User'}
            </h1>
            
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 text-on-surface-variant mb-4">
              {user?.email && (
                <div className="flex items-center gap-1.5">
                  <Icon name="mail" size={16} />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              
              {user?.location && (
                <div className="flex items-center gap-1.5">
                  <Icon name="location_on" size={16} />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}
              
              {user?.memberTier && (
                <div className="flex items-center gap-1.5">
                  <Icon name="workspace_premium" size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary capitalize">
                    {user.memberTier} Member
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 bg-white text-on-surface px-4 py-2 rounded-lg font-semibold text-sm border border-outline-variant hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  <Icon name="edit" size={18} />
                  Edit Profile
                </button>
                
                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 bg-white text-on-surface px-4 py-2 rounded-lg font-semibold text-sm border border-outline-variant hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  <Icon name="share" size={18} />
                  Share Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
