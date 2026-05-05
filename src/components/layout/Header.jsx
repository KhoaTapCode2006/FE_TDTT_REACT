import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useAuth } from "../../contexts/AuthContext";

const LANGS = [
  { code: "EN", flag: "🇺🇸", label: "English" },
  { code: "VI", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "ZH", flag: "🇨🇳", label: "简体中文" },
  { code: "JA", flag: "🇯🇵", label: "日本語" },
  { code: "IT", flag: "🇮🇹", label: "Italiano" },
  { code: "DE", flag: "🇩🇪", label: "Deutsch" },
];

function Header({ hideNavigation = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
  const [accountOpen, setAccountOpen] = useState(false);
  
  const langRef = useRef(null);
  const accountRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setAccountOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (user?.avatar?.url) {
      return user.avatar.url;
    }
    // Default Facebook-style avatar
    return null;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.trim().split(' ');
      if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
      }
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="flex-none w-full z-50 glass shadow-editorial">
      <nav className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto gap-4">
        <Link
          to="/"
          className="text-2xl font-headline font-extrabold tracking-tighter text-primary whitespace-nowrap"
        >
          Booking4U
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {!hideNavigation && (
            <>
              <Link 
                to="/" 
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  location.pathname === '/' 
                    ? 'text-primary border-b-2 border-secondary' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Hotels
              </Link>
              <Link 
                to="#" 
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  location.pathname === '/experiences' 
                    ? 'text-primary border-b-2 border-secondary' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Experiences
              </Link>
              <Link 
                to="#" 
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  location.pathname === '/social' 
                    ? 'text-primary border-b-2 border-secondary' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Social
              </Link>
              <Link 
                to="/account/collections" 
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  location.pathname === '/account/collections' 
                    ? 'text-primary border-b-2 border-secondary' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Collections
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((value) => !value)}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-surface-container transition-colors"
            >
              <Icon name="language" className="text-primary" size={22} />
              <span className="text-xs font-bold text-primary">{lang.code}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl shadow-editorial border border-outline-variant/20 z-50 overflow-hidden">
                <div className="p-2 flex flex-col gap-0.5">
                  {LANGS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item);
                        setLangOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        lang.code === item.code ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Menu */}
          <div className="relative" ref={accountRef}>
            {loading ? (
              // Loading state
              <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : isAuthenticated ? (
              // Authenticated user - show avatar
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-2 py-2 hover:bg-surface-container transition-colors"
                >
                  {getUserAvatar() ? (
                    <img 
                      src={getUserAvatar()} 
                      alt={user?.fullName || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{getUserInitials()}</span>
                    </div>
                  )}
                  <Icon name="expand_more" size={18} className="text-on-surface-variant" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl shadow-editorial border border-outline-variant/20 z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        {getUserAvatar() ? (
                          <img 
                            src={getUserAvatar()} 
                            alt={user?.fullName || 'User'} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-none">
                            <span className="text-white text-lg font-bold">{getUserInitials()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-on-surface truncate">
                            {user?.fullName || user?.email}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {user?.email}
                          </p>
                          {user?.memberTier && (
                            <p className="text-xs text-secondary font-semibold mt-0.5">
                              {user.memberTier} Member
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/account/mystay"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <Icon name="luggage" size={20} className="text-on-surface-variant" />
                        My Stays
                      </Link>
                      <Link
                        to="/account/savedlist"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <Icon name="favorite" size={20} className="text-on-surface-variant" />
                        Saved Lists
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <Icon name="person" size={20} className="text-on-surface-variant" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <Icon name="settings" size={20} className="text-on-surface-variant" />
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Icon name="logout" size={20} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Not authenticated - show sign in button
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container transition-colors"
                >
                  <Icon name="person_outline" size={20} />
                  Account
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-editorial border border-outline-variant/20 z-50 overflow-hidden">
                    <div className="p-3 space-y-2">
                      <Link
                        to="/auth/login"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-container transition-colors"
                      >
                        <Icon name="login" size={20} />
                        Sign In
                      </Link>
                      <Link
                        to="/auth/signup"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium text-primary hover:bg-surface-container-low transition-colors"
                      >
                        <Icon name="person_add" size={20} />
                        Create Account
                      </Link>
                    </div>
                    <div className="p-3 border-t border-outline-variant/20">
                      <p className="text-xs text-on-surface-variant text-center">
                        Join to unlock exclusive deals and save your preferences
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
