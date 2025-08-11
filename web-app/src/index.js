import { Analytics } from '@vercel/analytics/react';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-js/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css';

const options = {
  api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://eu.i.posthog.com'
}

// Componenta de fallback pentru erori
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PostHogProvider apiKey={process.env.REACT_APP_POSTHOG_KEY} options={options}>
      <PostHogErrorBoundary fallback={ErrorFallback}>
        <App />
        <Analytics />
      </PostHogErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>
);
