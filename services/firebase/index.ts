import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Check if we're using emulators
const useEmulator = Constants.expoConfig?.extra?.USE_FIREBASE_EMULATOR === 'true';

if (!Constants.expoConfig?.extra?.FIREBASE_API_KEY || !Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID) {
  throw new Error('Firebase configuration is missing. Make sure your .env file is properly set up with FIREBASE_API_KEY and FIREBASE_PROJECT_ID');
}

// Initialize with required configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.FIREBASE_API_KEY,
  projectId: Constants.expoConfig.extra.FIREBASE_PROJECT_ID,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || `${Constants.expoConfig.extra.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || `${Constants.expoConfig.extra.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators if in development
if (useEmulator) {
  console.log('🔧 Using Firebase Emulators');
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFunctionsEmulator(functions, 'localhost', 5001);
}