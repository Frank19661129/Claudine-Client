import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api/client';

export const Settings: FC = () => {
  const navigate = useNavigate();
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OAuth device code flow state
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadConnectedCalendars();
  }, []);

  const loadConnectedCalendars = async () => {
    try {
      const calendars = await api.getConnectedCalendars();
      setConnectedCalendars(calendars);
    } catch (err: any) {
      console.error('Failed to load calendars:', err);
    }
  };

  const startMicrosoftOAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.startMicrosoftOAuth();
      setUserCode(response.user_code);
      setVerificationUrl(response.verification_url);
      setShowOAuthFlow(true);

      // Start polling
      startPolling(response.device_code);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start OAuth');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = async (code: string) => {
    setPolling(true);
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('OAuth timeout - please try again');
        setPolling(false);
        return;
      }

      try {
        const response = await api.pollMicrosoftOAuth(code);
        if (response.success) {
          setShowOAuthFlow(false);
          setPolling(false);
          await loadConnectedCalendars();
          alert('Calendar connected successfully!');
        } else if (response.pending) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (err: any) {
        if (err.response?.status === 428) {
          // Still pending
          attempts++;
          setTimeout(poll, 5000);
        } else {
          setError(err.response?.data?.detail || 'OAuth failed');
          setPolling(false);
        }
      }
    };

    poll();
  };

  const disconnectCalendar = async (provider: string) => {
    if (!confirm(`Disconnect ${provider} calendar?`)) return;

    try {
      await api.disconnectCalendar(provider);
      await loadConnectedCalendars();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disconnect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <div className="bg-white border-b border-card-border p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/chat')}
              className="text-text-secondary hover:text-navy mb-2"
            >
              ← Back to Chat
            </button>
            <h1 className="text-2xl font-light text-navy tracking-wide">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Calendar Section */}
        <div className="bg-gradient-card rounded-card shadow-card p-6 mb-6">
          <h2 className="text-xl font-light text-navy mb-4 tracking-wide">
            Calendar Integration
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-input">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Connected Calendars */}
          {connectedCalendars.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3">
                Connected Calendars
              </h3>
              {connectedCalendars.map((cal) => (
                <div
                  key={cal.provider}
                  className="flex items-center justify-between p-4 bg-background rounded-input mb-2"
                >
                  <div>
                    <p className="font-medium text-navy">{cal.provider}</p>
                    <p className="text-xs text-text-muted">
                      {cal.is_primary && '(Primary) '}
                      Connected {new Date(cal.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => disconnectCalendar(cal.provider)}
                    className="text-sm text-accent hover:text-accent-dark"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* OAuth Flow */}
          {!showOAuthFlow ? (
            <button
              onClick={startMicrosoftOAuth}
              disabled={loading}
              className="w-full bg-gradient-navy text-white py-3 rounded-button hover:shadow-button transition-all disabled:opacity-50"
            >
              {loading ? 'Connecting...' : '+ Connect Microsoft 365 Calendar'}
            </button>
          ) : (
            <div className="p-6 bg-accent/10 rounded-card border-2 border-accent/20">
              <h3 className="text-lg font-medium text-navy mb-4">
                Connect Your Microsoft Account
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary mb-2">
                    1. Visit this URL on any device:
                  </p>
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white rounded-input text-accent hover:text-accent-dark font-mono text-sm"
                  >
                    {verificationUrl}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-text-secondary mb-2">
                    2. Enter this code:
                  </p>
                  <div className="p-4 bg-white rounded-input">
                    <p className="text-3xl font-bold text-navy tracking-widest text-center">
                      {userCode}
                    </p>
                  </div>
                </div>

                {polling && (
                  <div className="text-center">
                    <div className="inline-block w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-text-secondary mt-2">
                      Waiting for authorization...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
