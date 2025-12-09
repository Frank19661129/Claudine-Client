import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api/client';
import { Header } from '../../components/Header';

export const SettingsPage: FC = () => {
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);

  // OAuth device code flow state
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'microsoft' | 'google' | null>(null);
  const [userCode, setUserCode] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [polling, setPolling] = useState(false);

  // Location state
  const [location, setLocation] = useState<{city?: string; country?: string} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    loadConnectedCalendars();
    requestLocation();
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [tasksCount, fetchedNotesCount] = await Promise.all([
        api.getOpenTasksCount(),
        api.getNotesCount(),
      ]);
      setOpenTasksCount(tasksCount);
      setNotesCount(fetchedNotesCount);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  };

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city and country
          const response = await fetch(
            `http://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
            {
              headers: {
                'User-Agent': 'ClaudineApp/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          setLocation({
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            country: data.address?.country || 'Unknown'
          });
          setLocationLoading(false);
        } catch (err: any) {
          console.error('Geocoding error:', err);
          setLocationError(`Failed to get location details: ${err.message}`);
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Location permission denied';
        if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable';
        } else if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Check browser settings or use HTTPS.';
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
        enableHighAccuracy: false
      }
    );
  }, []);

  const loadConnectedCalendars = async () => {
    try {
      const calendars = await api.getConnectedCalendars();
      setConnectedCalendars(calendars);
    } catch (err: any) {
      console.error('Failed to load calendars:', err);
    }
  };

  const startOAuth = async (provider: 'microsoft' | 'google') => {
    setLoading(true);
    setError('');
    try {
      const response = provider === 'microsoft'
        ? await api.startMicrosoftOAuth()
        : await api.startGoogleOAuth();

      console.log('v2 Settings: OAuth response:', response);

      // Backend returns data directly, not wrapped in {success: true, ...}
      // Check for required fields instead
      if (!response.user_code || !response.device_code) {
        setError(response.error || 'Failed to start OAuth - missing required fields');
        return;
      }

      setUserCode(response.user_code);
      // Backend returns 'verification_url', not 'verification_uri'
      setVerificationUrl(response.verification_url || response.verification_uri);
      setOauthProvider(provider);
      setShowOAuthFlow(true);
      setCodeCopied(false);

      // Start polling
      startPolling(response.device_code, provider);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start OAuth');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = async (code: string, provider: 'microsoft' | 'google') => {
    setPolling(true);
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('OAuth timeout - please try again');
        setPolling(false);
        setShowOAuthFlow(false);
        return;
      }

      try {
        const response = provider === 'microsoft'
          ? await api.pollMicrosoftOAuth(code)
          : await api.pollGoogleOAuth(code);

        console.log(`Polling attempt ${attempts + 1}:`, response);

        // Backend returns: {success: true/false, pending: true/false, expires_at: timestamp}
        if (response.success && !response.pending) {
          // Successfully authenticated!
          setShowOAuthFlow(false);
          setPolling(false);
          setOauthProvider(null);
          await loadConnectedCalendars();
          alert(`${provider === 'microsoft' ? 'Microsoft' : 'Google'} Calendar connected successfully!`);
        } else if (response.pending || response.error === 'authorization_pending') {
          // Still waiting for user to authorize
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else if (response.error) {
          // Error occurred
          setError(response.message || response.error);
          setPolling(false);
          setShowOAuthFlow(false);
        } else {
          // Unknown response, keep polling
          attempts++;
          setTimeout(poll, 5000);
        }
      } catch (err: any) {
        setError(err.message || 'OAuth failed');
        setPolling(false);
        setShowOAuthFlow(false);
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

  const setPrimaryProvider = async (provider: string) => {
    try {
      await api.setPrimaryCalendar(provider);
      await loadConnectedCalendars();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set primary provider');
    }
  };

  const copyCodeToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(userCode);
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = userCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Code: ' + userCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <Header
        title="Settings"
        showBackButton={true}
        openTasksCount={openTasksCount}
        notesCount={notesCount}
      />

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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy capitalize">{cal.provider}</p>
                    {cal.is_primary && (
                      <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Connected {new Date(cal.connected_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!cal.is_primary && (
                    <button
                      onClick={() => setPrimaryProvider(cal.provider)}
                      className="text-sm text-navy hover:text-accent px-3 py-1 border border-navy hover:border-accent rounded transition-all"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    onClick={() => disconnectCalendar(cal.provider)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OAuth Flow */}
        {!showOAuthFlow ? (
          <div className="space-y-3">
            <button
              onClick={() => startOAuth('microsoft')}
              disabled={loading || showOAuthFlow}
              className="w-full bg-gradient-navy text-white py-3 rounded-button hover:shadow-button transition-all disabled:opacity-50"
            >
              {loading && oauthProvider === 'microsoft' ? 'Connecting...' : '+ Connect Microsoft 365 Calendar'}
            </button>
            <button
              onClick={() => startOAuth('google')}
              disabled={loading || showOAuthFlow}
              className="w-full bg-accent text-white py-3 rounded-button hover:shadow-button transition-all disabled:opacity-50"
            >
              {loading && oauthProvider === 'google' ? 'Connecting...' : '+ Connect Google Calendar'}
            </button>
          </div>
        ) : (
          <div className="p-6 bg-accent/10 rounded-card border-2 border-accent/20">
            <h3 className="text-lg font-medium text-navy mb-4">
              Connect Your {oauthProvider === 'microsoft' ? 'Microsoft' : 'Google'} Account
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
                  className="block p-3 bg-white rounded-input text-accent hover:text-accent-dark font-mono text-sm break-all"
                >
                  {verificationUrl}
                </a>
              </div>

              <div>
                <p className="text-sm text-text-secondary mb-2">
                  2. Enter this code:
                </p>
                <div className="p-4 bg-white rounded-input">
                  <p className="text-3xl font-bold text-navy tracking-widest text-center mb-3">
                    {userCode}
                  </p>
                  <button
                    onClick={copyCodeToClipboard}
                    className="w-full bg-accent text-white py-2 rounded-button hover:bg-accent-dark transition-all"
                  >
                    {codeCopied ? '✓ Gekopieerd!' : 'Kopieer code'}
                  </button>
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

        {/* Location Section */}
        <div className="bg-gradient-card rounded-card shadow-card p-6 mb-6">
        <h2 className="text-xl font-light text-navy mb-4 tracking-wide">
          Location
        </h2>

        {locationLoading && (
          <div className="p-4 bg-background rounded-input">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-text-secondary">Requesting location...</p>
            </div>
          </div>
        )}

        {locationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-input mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{locationError}</p>
              <button
                onClick={requestLocation}
                className="text-sm text-accent hover:text-accent-dark font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {location && !locationLoading && (
          <div className="p-4 bg-background rounded-input">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">
                  {location.city}, {location.country}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Current location detected
                </p>
              </div>
              <button
                onClick={requestLocation}
                className="text-sm text-accent hover:text-accent-dark"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

        {/* Copyright Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted font-light tracking-wide">
            Claudine © is bedacht, gemaakt en wordt onderhouden door GS.ai BV.
          </p>
        </div>
      </div>
    </div>
  );
};
