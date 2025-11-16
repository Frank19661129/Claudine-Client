import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { Logo } from './Logo';

export const TopBar: FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { cleanupEmptyConversations } = useChatStore();

  const handleLogout = async () => {
    await cleanupEmptyConversations();
    logout();
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button
          onClick={() => navigate('/v2/chat')}
          className="hover:opacity-80 transition-opacity"
        >
          <Logo />
        </button>
      </div>
      <div className="top-bar-right">
        <button className="user-menu" onClick={handleLogout}>
          <span>{user?.full_name || 'User'}</span>
          <span>▾</span>
        </button>
      </div>
    </div>
  );
};
