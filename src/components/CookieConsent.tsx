import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'storyverse_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
}

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
    };
    savePreferences(onlyNecessary);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    
    // Apply preferences (e.g., enable/disable analytics)
    if (prefs.analytics) {
      // Initialize analytics here
      console.log('Analytics enabled');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Main Banner */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <Cookie size={20} className="text-stone-600 dark:text-stone-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">
                Cookie Settings
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
                <Link to="/privacy" className="underline hover:text-stone-900 dark:hover:text-white">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Details */}
          {showDetails && (
            <div className="mt-5 pt-5 border-t border-stone-200 dark:border-stone-700 space-y-4">
              {/* Necessary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Necessary</p>
                  <p className="text-xs text-stone-500">Required for the website to function</p>
                </div>
                <div className="w-10 h-6 bg-stone-900 dark:bg-white rounded-full relative cursor-not-allowed opacity-50">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white dark:bg-stone-900 rounded-full" />
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Functional</p>
                  <p className="text-xs text-stone-500">Remember your preferences</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    preferences.functional ? 'bg-stone-900 dark:bg-white' : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                    preferences.functional 
                      ? 'right-1 bg-white dark:bg-stone-900' 
                      : 'left-1 bg-white dark:bg-stone-400'
                  }`} />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Analytics</p>
                  <p className="text-xs text-stone-500">Help us improve our service</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    preferences.analytics ? 'bg-stone-900 dark:bg-white' : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                    preferences.analytics 
                      ? 'right-1 bg-white dark:bg-stone-900' 
                      : 'left-1 bg-white dark:bg-stone-400'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="h-10 px-4 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleRejectAll}
              className="h-10 px-4 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              Reject All
            </button>
            {showDetails ? (
              <button
                onClick={handleAcceptSelected}
                className="h-10 px-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold rounded-lg hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                Save Preferences
              </button>
            ) : (
              <button
                onClick={handleAcceptAll}
                className="h-10 px-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold rounded-lg hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                Accept All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

