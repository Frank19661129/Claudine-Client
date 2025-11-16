import type { FC } from 'react';
import { useAuthStore } from '../../stores/authStore';

export const DebugPage: FC = () => {
  const { user, token, isAuthenticated, isLoading } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy mb-4">Debug Info</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-2">Auth Store State:</h2>
        <pre className="text-xs">
{JSON.stringify({
  isAuthenticated,
  isLoading,
  hasToken: !!token,
  hasUser: !!user,
  user: user ? { id: user.id, email: user.email, full_name: user.full_name } : null
}, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-2">LocalStorage:</h2>
        <pre className="text-xs">
{JSON.stringify({
  hasToken: !!localStorage.getItem('token'),
  hasUser: !!localStorage.getItem('user'),
  token: localStorage.getItem('token')?.substring(0, 20) + '...',
  user: localStorage.getItem('user')
}, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">Current URL:</h2>
        <p className="text-xs">{window.location.href}</p>
      </div>
    </div>
  );
};
