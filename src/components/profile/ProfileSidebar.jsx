import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';

/**
 * ProfileSidebar Component
 * Shared navigation sidebar for all profile pages
 * 
 * @param {Object} props
 * @param {string} props.activeItem - Active navigation item ('mystays' | 'savedlists' | 'reviews' | 'friends')
 */
const ProfileSidebar = ({ activeItem = 'mystays' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        setIsLoggingOut(true);
        await logout();
        navigate('/auth/login');
      } catch (error) {
        console.error('Logout failed:', error);
        setIsLoggingOut(false);
      }
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationItems = [
    {
      id: 'mystays',
      label: 'My Stays',
      icon: 'hotel',
      path: '/account/mystay',
    },
    {
      id: 'savedlists',
      label: 'Saved Lists',
      icon: 'bookmark',
      path: '/account/savedlist',
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: 'star',
      path: '/account/reviews',
      disabled: true,
    },
    {
      id: 'friends',
      label: 'Friends',
      icon: 'group',
      path: '/account/friends',
      disabled: true,
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-4 border-b border-outline-variant/20">
        <Link to="/" className="flex items-center gap-2">
          <Icon name="hotel" size={32} className="text-primary" />
          <span className="font-headline font-bold text-xl text-primary">
            Booking4LU
          </span>
        </Link>
      </div>

      {/* User Mini Card */}
      <div className="px-6 py-6 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.photoURL || user?.avatar?.url ? (
              <img
                src={user.photoURL || user.avatar.url}
                alt={user.displayName || user.fullName || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name="person" size={24} className="text-primary" />
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-on-surface truncate">
              {user?.displayName || user?.fullName || user?.username || 'User'}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Book New Stay Button */}
      <div className="px-6 py-4">
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
        >
          <Icon name="add" size={20} />
          Book New Stay
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="px-3 py-2 flex-1">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              {item.disabled ? (
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-on-surface-variant/40 cursor-not-allowed">
                  <Icon name={item.icon} size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="ml-auto text-xs bg-surface-container-low px-2 py-0.5 rounded">
                    Soon
                  </span>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    activeItem === item.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon 
                    name={item.icon} 
                    size={20}
                    variant={activeItem === item.id ? 'filled' : 'outlined'}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Help Center Link */}
      <div className="px-3 py-2 border-t border-outline-variant/20">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <Icon name="help" size={20} />
          <span className="text-sm font-medium">Help Center</span>
        </a>
      </div>

      {/* Logout Button */}
      <div className="px-6 py-4 border-t border-outline-variant/20">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 bg-surface-container-low text-on-surface py-3 px-4 rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon name="logout" size={20} />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-80 bg-white border-r border-outline-variant/20 h-full overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-outline-variant/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Icon name="hotel" size={28} className="text-primary" />
            <span className="font-headline font-bold text-lg text-primary">
              Booking4LU
            </span>
          </Link>
          
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label="Toggle menu"
          >
            <Icon name={isMobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col overflow-y-auto`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
};

export default ProfileSidebar;
