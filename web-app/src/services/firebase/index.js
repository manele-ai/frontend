import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { appCheckSiteKey, firebaseConfig, useEmulators } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-central2');
export const storage = getStorage(app);

if (useEmulators) {
  // @ts-ignore
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckSiteKey;
}

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(appCheckSiteKey),
  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  isTokenAutoRefreshEnabled: true
});

// Connect to emulators if in development
if (useEmulators) {
  console.log('🔧 Using Firebase Emulators');
  console.log('Environment details:', {
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname,
    REACT_APP_USE_FIREBASE_EMULATOR: process.env.REACT_APP_USE_FIREBASE_EMULATOR
  });
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8081);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ All emulators connected successfully');
  } catch (error) {
    console.log('⚠️ Emulators already connected or not available:', error.message);
  }
} else {
  console.log('🚀 Using Firebase Production Services');
  console.log('Production config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname
  });
}

console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Using emulators:', useEmulators);
console.log('Auth domain:', firebaseConfig.authDomain); 