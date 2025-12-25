import type { FC, ReactNode, ChangeEvent } from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useCounts } from '../hooks/useCounts';
import { api } from '../services/api/client';
import { PhotoEditorModal } from './PhotoEditorModal';
import { Logo } from './Logo';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
}

export const Header: FC<HeaderProps> = ({
  title,
  showBackButton = false,
  actions,
}) => {
  const { openTasksCount, notesCount, inboxCount } = useCounts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, setUser } = useAuthStore();
  const { cleanupEmptyConversations } = useChatStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test mode indicator from URL param
  const testMode = useMemo(() => {
    const flag = searchParams.get('testflag');
    if (flag === '1') return 1;
    if (flag === '2') return 2;
    return 0;
  }, [searchParams]);

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Selecteer een geldig afbeeldingsbestand');
      return;
    }

    // Validate file size (max 5MB for original upload)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bestand is te groot. Maximaal 5MB toegestaan.');
      return;
    }

    // Create object URL for the image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setShowPhotoEditor(true);
    setShowUserMenu(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCroppedPhoto = async (croppedImageBlob: Blob) => {
    try {
      setUploadingPhoto(true);
      setShowPhotoEditor(false);

      // Convert blob to file
      const file = new File([croppedImageBlob], 'profile.jpg', {
        type: 'image/jpeg',
      });

      const updatedUser = await api.uploadProfilePhoto(file);
      setUser(updatedUser);

      // Clean up object URL
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
        setSelectedImageUrl('');
      }
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert('Fout bij uploaden foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhotoEditor = () => {
    setShowPhotoEditor(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl('');
    }
  };

  return (
    <>
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={handleLogoClick}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          title="Ga naar homepage"
        >
          <div className="topbar-logo">
            <Logo size="md" />
          </div>
        </button>

        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="ml-4 text-white/80 hover:text-white text-sm"
          >
            ← Terug
          </button>
        )}

        {title && (
          <h1 className="ml-4 text-base font-normal text-white">{title}</h1>
        )}

        {/* Test Mode Indicator */}
        {testMode > 0 && (
          <div
            className="ml-4 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: '#22c55e',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {testMode === 1
              ? 'TESTMODE=1 GEEN UITVOERING'
              : 'TESTMODE=2 UITVOERING NA USER CONSENT'}
          </div>
        )}
      </div>

      <div className="topbar-right flex items-center gap-3">
          {/* Custom actions slot */}
          {actions && <div className="flex items-center gap-3">{actions}</div>}

          {/* Menu Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/inbox')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Inbox"
              style={{ fontSize: '1.2rem' }}
            >
              📥
              {inboxCount > 0 && (
                <span className="notification-badge">
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="text-lg hover:scale-110 transition-transform"
              title="Chat"
              style={{ fontSize: '1.2rem' }}
            >
              💬
            </button>

            <button
              onClick={() => navigate('/tasks')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Taken"
              style={{ fontSize: '1.2rem' }}
            >
              📋
              {openTasksCount > 0 && (
                <span className="notification-badge">
                  {openTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/notes')}
              className="relative text-lg hover:scale-110 transition-transform"
              title="Notities"
              style={{ fontSize: '1.2rem' }}
            >
              📝
              {notesCount > 0 && (
                <span className="notification-badge">
                  {notesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/monitor')}
              className="text-lg hover:scale-110 transition-transform"
              title="Monitor"
              style={{ fontSize: '1.2rem' }}
            >
              📊
            </button>
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="user-menu"
              title="Gebruikersmenu"
            >
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.full_name || 'User'}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center font-medium text-base">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-white/60">▾</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-card shadow-lg border border-card-border z-50">
                <div className="p-4">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-card-border">
                    {user?.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.full_name || 'User'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-navy text-white flex items-center justify-center font-medium text-lg">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy truncate">{user?.full_name || 'Gebruiker'}</p>
                      <p className="text-xs text-text-muted truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Upload Photo */}
                  <div className="py-3 border-b border-card-border">
                    <button
                      onClick={handlePhotoClick}
                      disabled={uploadingPhoto}
                      className="w-full text-left px-3 py-2 hover:bg-background rounded-input transition-colors text-sm text-navy disabled:opacity-50"
                    >
                      {uploadingPhoto ? '⏳ Uploaden...' : '📷 Profielfoto uploaden'}
                    </button>
                  </div>

                  {/* Profile Settings (placeholder) */}
                  <div className="py-3 border-b border-card-border">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-background rounded-input transition-colors text-sm text-navy"
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
    </header>

    {/* Photo Editor Modal */}
    {showPhotoEditor && selectedImageUrl && (
      <PhotoEditorModal
        imageUrl={selectedImageUrl}
        onSave={handleSaveCroppedPhoto}
        onCancel={handleCancelPhotoEditor}
      />
    )}
    </>
  );
};
