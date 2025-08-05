import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { firebaseConfig, reCaptchaSiteKey, useEmulators } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

if (!useEmulators) {
  // Initialize App Check with reCAPTCHA v3
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-central2');

// Connect to emulators if in development
if (useEmulators) {
  console.log('🔧 Using Firebase Emulators');
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8081);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Using emulators:', useEmulators); 