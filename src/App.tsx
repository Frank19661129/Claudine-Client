import type { FC } from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Monitor } from './pages/Monitor';
import { Tasks } from './pages/Tasks';
import { Notes } from './pages/Notes';
import { Inbox } from './pages/Inbox';
// V2 imports
import { ChatPage } from './pages/v2/ChatPage';
import { TasksPage } from './pages/v2/TasksPage';
import { NotesPage } from './pages/v2/NotesPage';
import { InboxPage } from './pages/v2/InboxPage';
import { MonitorPage } from './pages/v2/MonitorPage';
import { SettingsPage } from './pages/v2/SettingsPage';
import { TestPage } from './pages/v2/TestPage';
import { DebugPage } from './pages/v2/DebugPage';

const App: FC = () => {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/v2/test" element={<TestPage />} />
        <Route path="/v2/debug" element={<DebugPage />} />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/chat" replace />}
        />

        {/* V2 Routes - New Silver Cloud Design */}
        <Route
          path="/v2/chat"
          element={isAuthenticated ? <MainLayout><ChatPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/v2/tasks"
          element={isAuthenticated ? <MainLayout><TasksPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/v2/notes"
          element={isAuthenticated ? <MainLayout><NotesPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/v2/inbox"
          element={isAuthenticated ? <MainLayout><InboxPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/v2/monitor"
          element={isAuthenticated ? <MainLayout><MonitorPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/v2/settings"
          element={isAuthenticated ? <MainLayout><SettingsPage /></MainLayout> : <Navigate to="/login" replace />}
        />

        {/* V1 Protected routes - Original Design */}
        <Route
          path="/chat"
          element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/monitor"
          element={isAuthenticated ? <Monitor /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/tasks"
          element={isAuthenticated ? <Tasks /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/notes"
          element={isAuthenticated ? <Notes /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/inbox"
          element={isAuthenticated ? <Inbox /> : <Navigate to="/login" replace />}
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/chat' : '/login'} replace />}
        />

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
