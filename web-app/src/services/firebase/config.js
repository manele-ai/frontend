// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC-example-key",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "manele-ai-dev-fa776",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "manele-ai-dev-fa776.firebaseapp.com",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "manele-ai-dev-fa776.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:example",
};

// Environment settings
export const isDevelopment = process.env.NODE_ENV === 'development';
export const useEmulators = process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true' || 
                           window.location.hostname === 'localhost';

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_example'
};

// App configuration
export const appConfig = {
  name: 'Manele IO',
  version: '1.0.0',
  description: 'AI-powered Romanian manele song generator',
  defaultLanguage: 'ro',
  supportedLanguages: ['ro', 'en'],
  maxSongLength: 300, // seconds
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedAudioFormats: ['mp3', 'wav', 'ogg'],
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp']
};

// API endpoints
export const apiEndpoints = {
  generateSong: 'generateSong',
  getGenerationStatus: 'getGenerationStatus',
  downloadSong: 'downloadSong'
};

// Local storage keys
export const storageKeys = {
  userPreferences: 'userPreferences',
  songHistory: 'maneleList',
  authToken: 'authToken',
  theme: 'theme',
  language: 'language'
};

// Error messages
export const errorMessages = {
  networkError: 'Eroare de conexiune. Verifică internetul.',
  authError: 'Eroare de autentificare. Încearcă din nou.',
  generationError: 'Eroare la generarea piesei. Încearcă din nou.',
  downloadError: 'Eroare la descărcare. Încearcă din nou.',
  paymentError: 'Eroare la plată. Verifică datele cardului.',
  unknownError: 'A apărut o eroare neașteptată. Încearcă din nou.'
};

// Success messages
export const successMessages = {
  songGenerated: 'Piesa a fost generată cu succes!',
  songDownloaded: 'Piesa a fost descărcată cu succes!',
  profileUpdated: 'Profilul a fost actualizat cu succes!',
  paymentSuccessful: 'Plata a fost procesată cu succes!',
  passwordReset: 'Email-ul de resetare a fost trimis!'
};

// Validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Adresa de email nu este validă.'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Parola trebuie să aibă cel puțin 6 caractere.'
  },
  displayName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Numele trebuie să aibă între 2 și 50 de caractere.'
  },
  songTitle: {
    required: true,
    maxLength: 100,
    message: 'Titlul piesei nu poate depăși 100 de caractere.'
  }
};

// UI constants
export const uiConstants = {
  colors: {
    primary: '#eab111',
    secondary: '#e6c200',
    background: '#1a1a1a',
    surface: '#23242b',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    text: {
      primary: '#eab111',
      secondary: '#a2a5bd',
      disabled: '#666'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '20px',
    full: '50%'
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.3)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.4)'
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease'
  }
}; 