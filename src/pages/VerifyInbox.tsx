import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

export const VerifyInbox: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Geen verificatie token gevonden.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/onboarding/inbox/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Je Pepper inbox is geverifieerd!');
        } else {
          setStatus('error');
          setMessage(data.detail || data.message || 'Verificatie mislukt.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Netwerkfout. Probeer opnieuw.');
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-navy tracking-wide mb-2">PEPPER</h1>
          <p className="text-sm text-text-secondary tracking-widest uppercase">
            Inbox Verificatie
          </p>
        </div>

        {/* Card */}
        <div className="bg-gradient-card rounded-card shadow-card p-8 text-center">
          {status === 'verifying' && (
            <div>
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Inbox verifiëren...
              </h2>
              <p className="text-sm text-text-secondary">
                Even geduld, we controleren je inbox.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Inbox Geverifieerd!
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {message}
              </p>
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all"
              >
                Doorgaan met onboarding
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Verificatie Mislukt
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {message}
              </p>
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all"
              >
                Terug naar onboarding
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-8 tracking-widest uppercase">
          Powered by Claude AI
        </p>
      </div>
    </div>
  );
};
