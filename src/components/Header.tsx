import type { FC, ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
  openTasksCount?: number;
  notesCount?: number;
  inboxCount?: number;
}

export const Header: FC<HeaderProps> = ({
  title,
  showBackButton = false,
  actions,
  openTasksCount = 0,
  notesCount = 0,
  inboxCount = 0
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { cleanupEmptyConversations } = useChatStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    navigate('/chat');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    // Clean up any empty conversations before logging out
    await cleanupEmptyConversations();
    logout();
  };

  return (
    <div className="bg-white border-b border-card-border p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side: Claudine icon, back button, title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoClick}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            title="Ga naar homepage"
          >
            <img
              src="/claudine-icon.jpg"
              alt="Claudine"
              className="h-10 w-10 rounded-full object-cover border-2 border-navy/20 hover:border-accent transition-colors"
            />
          </button>

          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="text-text-secondary hover:text-navy"
            >
              ← Terug
            </button>
          )}

          {title && (
            <h1 className="text-2xl font-light text-navy tracking-wide">{title}</h1>
          )}
        </div>

        {/* Right side: Actions, Menu Icons, User Menu */}
        <div className="flex items-center gap-3">
          {/* Custom actions slot */}
          {actions && <div className="flex items-center gap-3">{actions}</div>}

          {/* Menu Icons */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => navigate('/chat')}
              className="text-lg hover:scale-110 transition-transform"
              title="Chat"
              style={{ fontSize: '1.35rem' }}
            >
              💬
            </button>

            <button
              onClick={() => navigate('/notes')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Notities"
              style={{ fontSize: '1.35rem' }}
            >
              📝
              {notesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-navy text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{ fontSize: '0.65rem' }}>
                  {notesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/inbox')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Inbox"
              style={{ fontSize: '1.35rem' }}
            >
              📥
              {inboxCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{ fontSize: '0.65rem' }}>
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/tasks')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Taken"
              style={{ fontSize: '1.35rem' }}
            >
              📋
              {openTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{ fontSize: '0.65rem' }}>
                  {openTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/monitor')}
              className="text-lg hover:scale-110 transition-transform"
              title="Monitor"
              style={{ fontSize: '1.35rem' }}
            >
              📊
            </button>
          </div>

          {/* User Menu */}
          <div className="relative ml-4" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Gebruikersmenu"
            >
              <div className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center font-medium border-2 border-navy/20 hover:border-accent transition-colors">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-card shadow-lg border border-card-border z-50">
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-card-border">
                    <div className="h-12 w-12 rounded-full bg-navy text-white flex items-center justify-center font-medium text-lg">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy truncate">{user?.full_name || 'Gebruiker'}</p>
                      <p className="text-xs text-text-muted truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Upload Photo */}
                  <div className="py-3 border-b border-card-border">
                    <button className="w-full text-left px-3 py-2 hover:bg-background rounded-input transition-colors text-sm">
                      📷 Profielfoto uploaden
                    </button>
                  </div>

                  {/* Profile Settings (placeholder) */}
                  <div className="py-3 border-b border-card-border">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-background rounded-input transition-colors text-sm"
                    >
                      ⚙️ Profielgegevens
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="pt-3">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-input transition-colors text-sm text-red-600"
                    >
                      🚪 Uitloggen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
