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
    // Capture song generation events
    captureSongGenerationStarted: ({
      style,
      hasLyricsDetails,
      hasDedication,
      hasDonation,
      mode,
      price,
    }) => {
      posthog?.capture('song_generation_started', {
        style: style,
        mode: mode,
        price: price,
        has_lyrics_details: hasLyricsDetails,
        has_dedication: hasDedication,
        has_donation: hasDonation,
        timestamp: new Date().toISOString()
      });
    },
    captureSongGenerationError: ({
      error_message,
    }) => {
      posthog?.capture('song_generation_error', {
        error_message: error_message,
        timestamp: new Date().toISOString()
      });
    },
    // Capture song completion
    captureSongCompleted: (songId, style, duration) => {
      posthog?.capture('song_generation_completed', {
        song_id: songId,
        style: style,
        generation_duration: duration,
        timestamp: new Date().toISOString()
      });
    },
    // Capture only for generate button on easy and complex forms
    captureGenerateClick: (mode) => {
      posthog?.capture('generate_click', {
        mode: mode,
        timestamp: new Date().toISOString()
      });
    },
    // Capture button clicks
    captureButtonClick: (buttonName, page) => {
      posthog?.capture('button_clicked', {
        button_name: buttonName,
        page: page,
        timestamp: new Date().toISOString()
      });
    },    
    // Capture errors
    captureError: (errorType, errorMessage, page) => {
      posthog?.capture('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        page: page,
        timestamp: new Date().toISOString()
      });
    },
    // Capture user sign up event
    captureSignUp: (provider, success, creationTime=null) => {
      posthog?.capture('user_signed_up', {
        provider: provider,
        success: success,
        ...(creationTime && { creation_time: creationTime }),
        timestamp: new Date().toISOString()
      });
    },
    // Capture user sign in event
    captureSignIn: (provider, success, creationTime=null) => {
      posthog?.capture('user_signed_in', {
        provider: provider,
        success: success,
        ...(creationTime && { creation_time: creationTime }),
        timestamp: new Date().toISOString()
      });
    },
    // Reset user properties
    resetUserIdentity: () => {
      posthog?.reset();
    },
    // Set user properties
    identifyUser: (uid, email, displayName) => {
      posthog?.identify(uid, {
        email: email,
        display_name: displayName,
        timestamp: new Date().toISOString()
      });
    },
    // Track payment events
    capturePayment: (paymentType, amount, success) => {
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
