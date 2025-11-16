import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCounts } from '../../hooks/useCounts';

export const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openTasksCount, notesCount, inboxCount } = useCounts();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Views */}
      <div className="sidebar-section">
        <div className="sidebar-header">Views</div>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/chat'); }}
          className={`sidebar-item ${isActive('/v2/chat') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">💬</span>
          <span className="sidebar-label">Chat</span>
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/tasks'); }}
          className={`sidebar-item ${isActive('/v2/tasks') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📋</span>
          <span className="sidebar-label">Taken</span>
          {openTasksCount > 0 && (
            <span className="sidebar-count">{openTasksCount}</span>
          )}
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/notes'); }}
          className={`sidebar-item ${isActive('/v2/notes') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📝</span>
          <span className="sidebar-label">Notities</span>
          {notesCount > 0 && (
            <span className="sidebar-count">{notesCount}</span>
          )}
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/inbox'); }}
          className={`sidebar-item ${isActive('/v2/inbox') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📥</span>
          <span className="sidebar-label">Inbox</span>
          {inboxCount > 0 && (
            <span className="sidebar-count">{inboxCount}</span>
          )}
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/monitor'); }}
          className={`sidebar-item ${isActive('/v2/monitor') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-label">Monitor</span>
        </a>
      </div>

      {/* Beheren */}
      <div className="sidebar-section">
        <div className="sidebar-header">Beheren</div>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/v2/settings'); }}
          className={`sidebar-item ${isActive('/v2/settings') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">Instellingen</span>
        </a>
      </div>
    </aside>
  );
};
