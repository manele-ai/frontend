import { usePostHog } from 'posthog-js/react';

// Hook pentru a accesa PostHog în componente
export const usePostHogTracking = () => {
  const posthog = usePostHog();
  
  return {
    // Track page views
    trackPageView: (pageName) => {
      posthog?.capture('page_viewed', {
        page_name: pageName,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track song generation events
    trackSongGeneration: (style, mode, price) => {
      posthog?.capture('song_generation_started', {
        style: style,
        mode: mode,
        price: price,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track song completion
    trackSongCompleted: (songId, style, duration) => {
      posthog?.capture('song_generation_completed', {
        song_id: songId,
        style: style,
        generation_duration: duration,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track user interactions
    trackButtonClick: (buttonName, page) => {
      posthog?.capture('button_clicked', {
        button_name: buttonName,
        page: page,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track errors
    trackError: (errorType, errorMessage, page) => {
      posthog?.capture('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        page: page,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track user authentication
    trackAuth: (authType, success) => {
      posthog?.capture('user_authentication', {
        auth_type: authType,
        success: success,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track payment events
    trackPayment: (paymentType, amount, success) => {
      posthog?.capture('payment_attempted', {
        payment_type: paymentType,
        amount: amount,
        success: success,
        timestamp: new Date().toISOString()
      });
    },
    
    // Capture exceptions manually
    captureException: (error, additionalProps = {}) => {
      posthog?.captureException(error, {
        ...additionalProps,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent
      });
    }
  };
};

// Funcție pentru a seta user properties
export const setUserProperties = (posthog, user) => {
  if (posthog && user) {
    posthog.identify(user.uid, {
      email: user.email,
      display_name: user.displayName,
      created_at: user.metadata?.creationTime,
      last_sign_in: user.metadata?.lastSignInTime
    });
  }
};

// Funcție pentru a configura global error handling
export const setupGlobalErrorHandling = (posthog) => {
  if (!posthog) return;

  // Capture unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    posthog.capture('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    posthog.capture('unhandled_promise_rejection', {
      reason: event.reason?.toString(),
      promise: event.promise,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  });
};
