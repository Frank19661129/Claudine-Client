import { FC, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Chat } from './pages/Chat';

const App: FC = () => {
  const { isAuthenticated, initAuth } = useAuthStore();

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/chat" replace />}
        />

        {/* Protected routes */}
        <Route
          path="/chat"
          element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
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
