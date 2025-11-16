import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { Logo } from './Logo';

export const TopBar: FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { cleanupEmptyConversations } = useChatStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await cleanupEmptyConversations();
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button
          onClick={() => navigate('/chat')}
          className="hover:opacity-80 transition-opacity"
        >
          <Logo />
        </button>
      </div>
      <div className="top-bar-right">
        <div className="relative" ref={dropdownRef}>
          <button
            className="user-menu"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{user?.full_name || 'User'}</span>
            <span>{showDropdown ? '▴' : '▾'}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-card-border py-1 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-background transition-colors"
              >
                ⚙️ Instellingen
              </button>
              <div className="border-t border-card-border my-1"></div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🚪 Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
