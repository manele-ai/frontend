import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-js/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPixel } from './services/pixel';
import './styles/App.css';

// How long a persisted snapshot on disk is considered valid for rehydration.
// If the snapshot is older than maxAge, it’s ignored on app start. Default 24 hours.
const DEFAULT_MAX_AGE_CACHE_ON_DISK = 1000 * 60 * 60 * 24; // 24 hours

// How long an inactive query may remain in the cache before it’s garbage-collected. 
// Default = 5 minutes
const DEFAULT_GARBAGE_COLLECTION_TIME = 1000 * 60 * 60 * 24; // 5 minutes

// --- PostHog config ---
const options = {
  api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://eu.i.posthog.com',
  capture_pageview: false, // we track it manually
  opt_out_capturing_by_default: false, // disable capturing by default
};

// --- Error fallback component (unchanged) ---
const ErrorFallback = ({ error, componentStack }) => {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Ceva nu a mers bine</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        A apărut o eroare neașteptată. Te rugăm să încerci din nou.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Reîncarcă pagina
      </button>
    </div>
  );
};

// --- React Query client + persistence ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // tune to your needs
      gcTime: DEFAULT_GARBAGE_COLLECTION_TIME,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});

// // Works with localStorage just fine
// const persister = createAsyncStoragePersister({
//   storage: typeof window !== 'undefined' ? window.localStorage : undefined,
//   key: 'RQ_CACHE_v1',        // bump this to invalidate old caches
//   throttleTime: 1000,        // reduce write frequency
// });

// Init Pixel
initPixel();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider
      client={queryClient}
    >
      <PostHogProvider apiKey={process.env.REACT_APP_POSTHOG_KEY} options={options}>
        <PostHogErrorBoundary fallback={ErrorFallback}>
          <App />
          <Analytics />
        </PostHogErrorBoundary>
      </PostHogProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
