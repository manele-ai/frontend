import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('cookieConsent');
    
    if (hasConsent === null) {
      // User hasn't made a choice yet, show the notification
      setShowConsent(true);
    } else {
      // Apply user's previous choice
      if (hasConsent === 'true') {
        posthog?.opt_in_capturing();
      } else {
        posthog?.opt_out_capturing();
      }
    }
  }, [posthog]);

  const handleAccept = () => {
    // Save preference and enable analytics
    localStorage.setItem('cookieConsent', 'true');
    posthog?.opt_in_capturing();
    setShowConsent(false);
  };

  const handleDecline = () => {
    // Save preference and disable analytics
    localStorage.setItem('cookieConsent', 'false');
    posthog?.opt_out_capturing();
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="cookie-consent-container">
      <div>
        <p className="cookie-consent-title">
          <span role="img" aria-label="cookie">🍪</span> Notificare Cookie
        </p>
        <p className="cookie-consent-description">
          Folosim cookie-uri necesare pentru a asigura funcționarea site-ului nostru. De asemenea, am dori să setăm cookie-uri opționale de analiză pentru a ne ajuta să îl îmbunătățim.
        </p>
        <p className="cookie-consent-policy-text">
          Nu folosim cookie-uri pentru scopuri de marketing. Pentru mai multe detalii despre cookie-urile noastre și modul în care le folosim, vă rugăm să citiți{' '}
          <a 
            href="/privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cookie-consent-link"
          >
            Politica de confidențialitate
          </a>.
        </p>
      </div>
      <div className="cookie-consent-buttons">
        <button
          onClick={handleDecline}
          className="cookie-consent-decline"
        >
          Doar Cookie-uri Necesare
        </button>
        <button
          onClick={handleAccept}
          className="cookie-consent-accept"
        >
          Acceptă Tot
        </button>
      </div>
    </div>
  );
};

export default CookieConsent; 