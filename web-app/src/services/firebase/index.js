import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Check if we're using emulators
const useEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true' || 
                   window.location.hostname === 'localhost';

// Development configuration - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC-example-key",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "manele-ai-dev-fa776",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "manele-ai-dev-fa776.firebaseapp.com",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "manele-ai-dev-fa776.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:example",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators if in development
if (useEmulator) {
  console.log('🔧 Using Firebase Emulators');
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Using emulators:', useEmulator); 