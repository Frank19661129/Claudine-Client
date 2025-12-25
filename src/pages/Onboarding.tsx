import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

interface OnboardingStatus {
  email: string;
  email_verified: boolean;
  inbox_email: string | null;
  inbox_prefix: string | null;
  inbox_verified: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  onboarding_completed: boolean;
  current_step: number;
}

export const Onboarding: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Email verification
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [devCode, setDevCode] = useState(''); // For development

  // Step 2: Inbox setup
  const [inboxPrefix, setInboxPrefix] = useState('');
  const [inboxEmail, setInboxEmail] = useState('');
  const [prefixTooLong, setPrefixTooLong] = useState(false);
  const [suggestedPrefix, setSuggestedPrefix] = useState('');

  // Step 3: Inbox verification
  const [inboxVerificationSent, setInboxVerificationSent] = useState(false);
  const [devVerificationUrl, setDevVerificationUrl] = useState('');

  // Step 4: Phone verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneDevCode, setPhoneDevCode] = useState('');

  // Load onboarding status on mount
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch unique inbox suggestion when entering step 2
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (currentStep === 2 && !inboxPrefix) {
        try {
          const response = await fetch(`${API_URL}/onboarding/inbox/suggest`, {
            headers: getAuthHeader(),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.local_part) {
              setInboxPrefix(data.local_part);
            }
          }
        } catch (err) {
          console.error('Failed to fetch inbox suggestion:', err);
        }
      }
    };
    fetchSuggestion();
  }, [currentStep, inboxPrefix]);

  const loadOnboardingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/onboarding/status`, {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const status: OnboardingStatus = await response.json();
        setCurrentStep(status.current_step);
        if (status.inbox_email) {
          setInboxEmail(status.inbox_email);
        }
        if (status.inbox_prefix) {
          setInboxPrefix(status.inbox_prefix);
        }
        if (status.phone_number) {
          setPhoneNumber(status.phone_number);
        }
        if (status.onboarding_completed) {
          navigate('/chat');
        }
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    }
  };

  // Step 1: Send email verification code
  const handleSendEmailCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/email/send-code`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setEmailSent(true);
        setSuccess('Verificatiecode verzonden naar je email');
        if (data._dev_code) {
          setDevCode(data._dev_code);
        }
      } else {
        setError(data.detail || 'Kon geen verificatiecode verzenden');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step 1: Verify email code
  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/email/verify`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Email geverifieerd!');
        setCurrentStep(2);
      } else {
        setError(data.detail || 'Ongeldige code');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step 2: Generate inbox address
  const handleGenerateInbox = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    setPrefixTooLong(false);
    try {
      const response = await fetch(`${API_URL}/onboarding/inbox/generate`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: inboxPrefix || null }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInboxEmail(data.inbox_email);
        setSuccess(`Je Pepper inbox is klaar: ${data.inbox_email}`);
        setCurrentStep(3);
      } else if (data.prefix_too_long) {
        setPrefixTooLong(true);
        setSuggestedPrefix(data.suggested_prefix);
        setError(`Prefix is te lang (${data.current_length} tekens, max ${data.max_length}). Pas aan of gebruik de suggestie.`);
      } else {
        setError(data.detail || data.message || 'Kon inbox niet aanmaken');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step 3: Send inbox verification email
  const handleSendInboxVerification = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/inbox/send-verification`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setInboxVerificationSent(true);
        setSuccess('Verificatie email verzonden. Klik op de link in de email.');
        if (data._dev_verification_url) {
          setDevVerificationUrl(data._dev_verification_url);
        }
      } else {
        setError(data.detail || 'Kon geen verificatie email verzenden');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step 4: Send phone verification code
  const handleSendPhoneCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/phone/send-code`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        setPhoneSent(true);
        setPhoneNumber(data.phone_number);
        setSuccess('SMS verificatiecode verzonden');
        if (data._dev_code) {
          setPhoneDevCode(data._dev_code);
        }
      } else {
        setError(data.detail || 'Kon geen SMS verzenden');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step 4: Verify phone code
  const handleVerifyPhone = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/phone/verify`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Telefoonnummer geverifieerd!');
        setCurrentStep(5);
      } else {
        setError(data.detail || 'Ongeldige code');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Skip phone verification
  const handleSkipPhone = () => {
    setCurrentStep(5);
  };

  // Step 5: Complete onboarding
  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/chat');
      } else {
        setError(data.detail || 'Kon onboarding niet voltooien');
      }
    } catch (err) {
      setError('Netwerkfout. Probeer opnieuw.');
    }
    setIsLoading(false);
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step < currentStep
                ? 'bg-green-500 text-white'
                : step === currentStep
                ? 'bg-accent text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < 5 && (
            <div
              className={`w-8 h-1 mx-0.5 transition-all ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-navy tracking-wide mb-2">PEPPER</h1>
          <p className="text-sm text-text-secondary tracking-widest uppercase">
            Account Setup
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Card */}
        <div className="bg-gradient-card rounded-card shadow-card p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-input">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-input">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Step 1: Email Verification */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Stap 1: Email Verificatie
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                We sturen een verificatiecode naar <strong>{user?.email}</strong>
              </p>

              {!emailSent ? (
                <button
                  onClick={handleSendEmailCode}
                  disabled={isLoading}
                  className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Verzenden...' : 'Verstuur Verificatiecode'}
                </button>
              ) : (
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                      Verificatiecode
                    </label>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      maxLength={6}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-background border border-card-border rounded-input text-navy text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    {devCode && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Dev code: <code className="bg-gray-100 px-2 py-1 rounded">{devCode}</code>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || emailCode.length !== 6}
                    className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verifiëren...' : 'Verifieer Email'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={isLoading}
                    className="w-full text-accent hover:text-accent-dark text-sm"
                  >
                    Nieuwe code versturen
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Step 2: Inbox Setup */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Stap 2: Pepper Inbox
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Dit wordt jouw persoonlijke Pepper inbox. Stuur emails naar dit adres en Pepper verwerkt ze voor je.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                    Jouw inbox adres
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={inboxPrefix}
                      onChange={(e) => setInboxPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className={`flex-1 px-4 py-3 bg-background border rounded-l-input text-navy focus:outline-none focus:ring-2 focus:ring-accent ${
                        prefixTooLong ? 'border-red-500' : 'border-card-border'
                      }`}
                    />
                    <span className="px-4 py-3 bg-gray-100 border border-l-0 border-card-border rounded-r-input text-text-secondary text-sm whitespace-nowrap">
                      @inbox.pepper-ai.com
                    </span>
                  </div>
                  {prefixTooLong && suggestedPrefix && (
                    <button
                      type="button"
                      onClick={() => setInboxPrefix(suggestedPrefix)}
                      className="text-xs text-accent mt-2"
                    >
                      Gebruik suggestie: {suggestedPrefix}
                    </button>
                  )}
                  <p className="text-xs text-text-muted mt-2">
                    Pas aan indien gewenst.
                  </p>
                </div>

                <button
                  onClick={() => handleGenerateInbox()}
                  disabled={isLoading || !inboxPrefix}
                  className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Aanmaken...' : 'Maak inbox aan'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Inbox Verification */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Stap 3: Inbox Verificatie
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                We sturen een verificatie email vanuit je Pepper inbox naar je persoonlijke email om te bevestigen dat alles werkt.
              </p>

              {inboxEmail && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-input">
                  <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Je Pepper Inbox</p>
                  <p className="text-sm text-blue-800 font-mono break-all">{inboxEmail}</p>
                </div>
              )}

              {!inboxVerificationSent ? (
                <div className="space-y-4">
                  <button
                    onClick={handleSendInboxVerification}
                    disabled={isLoading}
                    className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verzenden...' : 'Verstuur Verificatie Email'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-input">
                    <p className="text-sm text-amber-800">
                      We hebben een email gestuurd naar <strong>{user?.email}</strong>. Klik op de verificatielink in die email om door te gaan.
                    </p>
                  </div>
                  {devVerificationUrl && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-input">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dev verificatie link</p>
                      <a
                        href={devVerificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline break-all"
                      >
                        {devVerificationUrl}
                      </a>
                    </div>
                  )}
                  <button
                    onClick={handleSendInboxVerification}
                    disabled={isLoading}
                    className="w-full text-accent hover:text-accent-dark text-sm"
                  >
                    Nieuwe verificatie email versturen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Phone Verification */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Stap 4: Telefoonnummer
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Voeg een telefoonnummer toe voor extra notificaties en beveiliging.
              </p>

              {inboxEmail && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-input">
                  <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Je Pepper Inbox (geverifieerd)</p>
                  <p className="text-sm text-green-800 font-mono break-all">{inboxEmail}</p>
                </div>
              )}

              {!phoneSent ? (
                <form onSubmit={handleSendPhoneCode} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                      Telefoonnummer
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="06 12345678"
                      className="w-full px-4 py-3 bg-background border border-card-border rounded-input text-navy focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !phoneNumber}
                    className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verzenden...' : 'Verstuur SMS Code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipPhone}
                    className="w-full text-text-secondary hover:text-navy text-sm py-2"
                  >
                    Overslaan →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhone} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                      SMS Code
                    </label>
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      maxLength={6}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-background border border-card-border rounded-input text-navy text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    {phoneDevCode && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Dev code: <code className="bg-gray-100 px-2 py-1 rounded">{phoneDevCode}</code>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || phoneCode.length !== 6}
                    className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verifiëren...' : 'Verifieer Nummer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipPhone}
                    className="w-full text-text-secondary hover:text-navy text-sm py-2"
                  >
                    Overslaan →
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-light text-navy mb-2 tracking-wide">
                Welkom bij Pepper!
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Je account is klaar. Je kunt nu aan de slag.
              </p>

              {inboxEmail && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-input text-left">
                  <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Je Pepper Inbox</p>
                  <p className="text-sm text-green-800 font-mono break-all">{inboxEmail}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Stuur emails naar dit adres om ze te laten verwerken door Pepper.
                  </p>
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full bg-gradient-navy text-white py-3 rounded-button font-light tracking-wide hover:shadow-button transition-all disabled:opacity-50"
              >
                {isLoading ? 'Afronden...' : 'Start met Pepper →'}
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
