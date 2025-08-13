import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '../../services/firebase';
import { createUserIfNotExists, updateUserProfile as updateUserProfileCloudFn } from '../../services/firebase/functions';
import { usePostHogTracking } from '../../utils/posthog';

// User context structure
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
  waitForUserDocCreation: async (_timeoutMs = 10000) => {
    // Placeholder, fuck js
    return Promise.resolve(false);
  },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserDocCreated, setIsUserDocCreated] = useState(null);
  const [error, setError] = useState(null);
  const recaptchaVerifier = useRef(null);
  const recaptchaContainerRef = useRef(null);
  // Resolver ref
  const readyResolvers = useRef([]);
  
  // Initialize PostHog tracking
  const { trackAuth } = usePostHogTracking();

  /**
   * Wait until auth + user doc creation finishes, or timeout expires.
   * @param timeoutMs – how many milliseconds to wait before auto‐failing (resolves to false).
   * @returns Promise<boolean> – true if succeeded, false if failed or timed out.
   */
  const waitForUserDocCreation = (timeoutMs = 10000) => {
    return new Promise((resolve) => {
      // Check if already settled
      if (isUserDocCreated !== null) {
        return resolve(isUserDocCreated);
      }
      // Otherwise, add resolver to queue
      const resolver = (docCreationStatus) => {
        clearTimeout(timer);
        resolve(docCreationStatus);
      };
      readyResolvers.current.push(resolver);

      // Start the timeout
      const timer = setTimeout(() => {
        // Remove this resolver so it doesn’t fire later
        readyResolvers.current = readyResolvers.current.filter(r => r !== resolver);
        // Timeout is treated as “failed to get ready”
        resolve(false);
      }, timeoutMs);
    });
  };

  function flushUserDocCreationResolvers(status) {
    readyResolvers.current.forEach((res) => res(status));
    readyResolvers.current = [];
  }

  const fetchOrCreateUserProfile = async (firebaseUser) => {
    setIsUserDocCreated(null);

    try {
      // Force refresh token
      await firebaseUser.reload();
      // Fetch profile if exists, otherwise creates and returns it
      const { profile } = await createUserIfNotExists({
          displayName: firebaseUser.displayName,
      });
      const userProfile = { id: profile.uid, ...profile };
      setUserProfile(userProfile);

      setIsUserDocCreated(true);
      flushUserDocCreationResolvers(true);
      return userProfile;

    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      setIsUserDocCreated(false);
      flushUserDocCreationResolvers(false);
      throw error;
    }
  };

  // Fetch user profile from Firestore
  // const fetchUserProfile = async (uid) => {
  //   try {
  //     const userDoc = await getDoc(doc(db, 'usersPublic', uid));
  //     if (!userDoc.exists()) {
  //       return null;
  //     }
  //     return { id: userDoc.id, ...userDoc.data() };
  //   } catch (error) {
  //     console.error('Error fetching/creating user profile:', error);
  //     return null;
  //   }
  // };

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
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name in Firebase Auth and wait for it to complete
      await updateProfile(user, {
        displayName,
      });
      await fetchOrCreateUserProfile(user);
      trackAuth('email_signup', true);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      trackAuth('email_signup', false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await fetchOrCreateUserProfile(user);
      trackAuth('email_signin', true);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      trackAuth('email_signin', false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      auth.languageCode = 'ro';
      await signInWithRedirect(auth, provider);
      trackAuth('google_signin', true);
      // After this call, the page will redirect. Processing continues in the redirect handler effect.
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      trackAuth('google_signin', false);
      setLoading(false);
      throw new Error(errorMessage);
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
    
    try {
      const { user } = await confirmationResult.confirm(code);
      
      // Update display name first if provided (for new users)
      if (displayName) {
        await updateProfile(user, {
          displayName,
        });
      }
      await fetchOrCreateUserProfile(user);
    } catch (error) {
      console.error('Phone verification error:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google redirect result
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('[Auth] Got redirect result:', { 
          hasResult: !!result,
          hasUser: result?.user ? true : false,
          operationType: result?.operationType,
          providerId: result?.providerId
        });
        if (isMounted && result && result.user) {
          await fetchOrCreateUserProfile(result.user);
        }
      } catch (error) {
        // Ignore benign no-event errors; surface others
        const ignorable = ['auth/no-auth-event', 'auth/redirect-cancelled-by-user'];
        if (!ignorable.includes(error?.code)) {
          console.error('Google redirect result error:', error);
          const errorMessage = getAuthErrorMessage(error.code);
          setError(errorMessage);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // Auth state listener
  useEffect(() => {
    let unsub = null;
    setLoading(true);

    unsub = onAuthStateChanged(auth, async (user) => {
      // Logged out
      if (!user) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      // Logged in
      setUser(user);
      try {
        await fetchOrCreateUserProfile(user);
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
    waitForUserDocCreation,
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
    default:
      return 'A apărut o eroare. Încearcă din nou.';
  }
} 