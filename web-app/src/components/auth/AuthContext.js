import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, db } from '../../services/firebase';
import { createUserIfNotExists, updateUserProfile as updateUserProfileCloudFn } from '../../services/firebase/functions';
import { usePostHogTracking } from '../../utils/posthog';

// User context structure

export const AUTH_PHASE = {
  NOT_STARTED: 'not-started',
  STARTED: 'started',
  READY: 'ready',
  FAILED: 'failed',
};

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signUp: async (email, password, displayName) => Promise.resolve(),
  signIn: async (email, password) => Promise.resolve(),
  signInWithGoogle: async () => Promise.resolve(),
  signInWithPhone: async (phoneNumber) => Promise.resolve(null),
  verifyPhoneCode: async (verificationId, code, displayName) => Promise.resolve(),
  signOut: async () => Promise.resolve(),
  resetPassword: async (email) => Promise.resolve(),
  updateUserProfile: async (updates) => Promise.resolve(),
  isAuthenticated: false,
  authPhase: AUTH_PHASE.NOT_STARTED,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authPhase, setAuthPhase] = useState(AUTH_PHASE.NOT_STARTED);
  const [error, setError] = useState(null);
  const recaptchaVerifier = useRef(null);
  const recaptchaContainerRef = useRef(null);
  
  // Initialize PostHog tracking
  const { captureSignUp, captureSignIn, identifyUser, resetUserIdentity } = usePostHogTracking();

  const fetchOrCreateUserProfile = async (firebaseUser) => {
    try {
      // Force refresh token
      await firebaseUser.reload();
      // Fetch profile if exists, otherwise creates and returns it
      const { profile } = await createUserIfNotExists({
          displayName: firebaseUser.displayName,
      });
      const userProfile = { id: profile.uid, ...profile };
      setUserProfile(userProfile);

      setAuthPhase(AUTH_PHASE.READY);
      return userProfile;

    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      setAuthPhase(AUTH_PHASE.FAILED);
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'usersPublic', uid));
      if (!userDoc.exists()) {
        return null;
      }
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) throw new Error('No user authenticated');
    try {
      const { displayName, photoURL } = await updateUserProfileCloudFn({
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });

      // Update local state
      setUserProfile(prev => ({ ...prev, displayName, photoURL }));

      // Update Firebase Auth profile if displayName or photoURL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    setAuthPhase(AUTH_PHASE.STARTED);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name in Firebase Auth and wait for it to complete
      await updateProfile(user, { displayName });
      await fetchOrCreateUserProfile(user);

      captureSignUp('email', true, user.metadata.creationTime);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      captureSignUp('email', false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    setAuthPhase(AUTH_PHASE.STARTED);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await fetchOrCreateUserProfile(user);

      captureSignIn('email', true, user.metadata.creationTime);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      captureSignIn('email', false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    setAuthPhase(AUTH_PHASE.STARTED);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      // Update display name in Firebase Auth and wait for it to complete
      await updateProfile(user, {
        displayName: user.displayName,
      });
      await fetchOrCreateUserProfile(user);

      captureSignIn('google', true, user.metadata.creationTime);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      captureSignIn('google', false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Initialize recaptcha verifier
  useEffect(() => {
    // Clear any existing verifier
    if (recaptchaVerifier.current) {
      recaptchaVerifier.current.clear();
      recaptchaVerifier.current = null;
    }

    // Create container if it doesn't exist
    if (!recaptchaContainerRef.current) {
      recaptchaContainerRef.current = document.createElement('div');
      recaptchaContainerRef.current.id = 'recaptcha-container';
      document.body.appendChild(recaptchaContainerRef.current);
    }

    // Initialize verifier
    try {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {}
      });
    } catch (error) {
      console.error('Error initializing RecaptchaVerifier:', error);
    }

    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
      if (recaptchaContainerRef.current) {
        document.body.removeChild(recaptchaContainerRef.current);
        recaptchaContainerRef.current = null;
      }
    };
  }, []);

  // Sign in with phone number
  const signInWithPhone = async (phoneNumber) => {
    setError(null);
    setLoading(true);
    setAuthPhase(AUTH_PHASE.STARTED);
    try {
      // Clean up any existing reCAPTCHA verifier and container
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
      
      // Remove and recreate the container element
      if (recaptchaContainerRef.current) {
        document.body.removeChild(recaptchaContainerRef.current);
      }
      recaptchaContainerRef.current = document.createElement('div');
      recaptchaContainerRef.current.id = 'recaptcha-container';
      document.body.appendChild(recaptchaContainerRef.current);

      // Create new RecaptchaVerifier instance
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {}
      });

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier.current
      );
      return confirmationResult;
    } catch (error) {
      console.error('Phone sign in error:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (confirmationResult, code, displayName = '') => {
    setError(null);
    setLoading(true);
    setAuthPhase(AUTH_PHASE.STARTED);
    try {
      const { user } = await confirmationResult.confirm(code);
      
      // Update display name first if provided (for new users)
      if (displayName) {
        await updateProfile(user, {
          displayName,
        });
      }
      await fetchOrCreateUserProfile(user);

      captureSignIn('phone', true, user.metadata.creationTime);
    } catch (error) {
      console.error('Phone verification error:', error);
      captureSignIn('phone', false);
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    let unsub = null;
    setLoading(true);

    unsub = onAuthStateChanged(auth, async (user) => {
      // Logged out
      if (!user) {
        resetUserIdentity();
  
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      // Logged in
      setUser(user);
      identifyUser(user.uid, user.email, user.displayName);
      try {
        const userProfile = await fetchUserProfile(user.uid);
        if (userProfile) {
          setUserProfile(userProfile);
        }
      } catch (e) {
        // Profile fetch/create failure is surfaced via error state elsewhere
      } finally {
        setLoading(false);
      }
    });
    return () => unsub && unsub();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneCode,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,
    isAuthenticated: !!user,
    authPhase,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Update error messages
function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Nu există niciun cont cu această adresă de email.';
    case 'auth/wrong-password':
      return 'Parola introdusă este incorectă.';
    case 'auth/email-already-in-use':
      return 'Această adresă de email este deja folosită.';
    case 'auth/weak-password':
      return 'Parola trebuie să aibă cel puțin 6 caractere.';
    case 'auth/invalid-email':
      return 'Adresa de email nu este validă.';
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Încearcă din nou mai târziu.';
    case 'auth/network-request-failed':
      return 'Eroare de conexiune. Verifică internetul.';
    case 'auth/popup-closed-by-user':
      return 'Fereastra de autentificare a fost închisă.';
    case 'auth/cancelled-popup-request':
      return 'Autentificarea a fost anulată.';
    case 'auth/invalid-phone-number':
      return 'Numărul de telefon nu este valid.';
    case 'auth/invalid-verification-code':
      return 'Codul de verificare nu este valid.';
    case 'auth/code-expired':
      return 'Codul de verificare a expirat.';
    case 'auth/missing-verification-code':
      return 'Te rugăm să introduci codul de verificare.';
    case 'auth/quota-exceeded':
      return 'Am întâmpinat o eroare. Te rugăm să încerci din nou mai târziu.';
    // Google-specific errors
    case 'auth/account-exists-with-different-credential':
      return 'Există deja un cont cu această adresă de email folosind o metodă diferită de autentificare.';
    case 'auth/auth-domain-config-required':
      return 'Configurația domeniului de autentificare este necesară pentru această operațiune.';
    case 'auth/credential-already-in-use':
      return 'Această credențială este deja asociată cu un cont diferit.';
    case 'auth/operation-not-allowed':
      return 'Această operațiune nu este permisă. Contactează administratorul.';
    case 'auth/requires-recent-login':
      return 'Această operațiune necesită o autentificare recentă. Te rugăm să te autentifici din nou.';
    case 'auth/redirect-cancelled-by-user':
      return 'Autentificarea Google a fost anulată.';
    case 'auth/redirect-operation-pending':
      return 'O operațiune de redirecționare este deja în desfășurare.';
    default:
      console.error('Unknown auth error code:', errorCode);
      return 'A apărut o eroare. Încearcă din nou.';
  }
} 