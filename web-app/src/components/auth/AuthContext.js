import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '../../services/firebase';
import { createUserIfNotExists, updateUserProfile as updateUserProfileCloudFn } from '../../services/firebase/functions';

// User context structure
const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signUp: async (email, password, displayName) => Promise.resolve(),
  signIn: async (email, password) => Promise.resolve(),
  signInWithGoogle: async () => Promise.resolve(),
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
  // Resolver ref
  const readyResolvers = useRef([]);

  /**
   * Wait until auth + user doc creation finishes, or timeout expires.
   * @param timeoutMs – how many milliseconds to wait before auto‐failing (resolves to false).
   * @returns Promise<boolean> – true if succeeded, false if failed or timed out.
   */
  const waitForUserDocCreation = (timeoutMs = 10000) => {
    console.log('Oh yeah this is the real one')
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
      await firebaseUser.getIdToken(true);
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
      // Update display name in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName,
      });
      await fetchOrCreateUserProfile(user);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
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
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
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
      const { user } = await signInWithPopup(auth, provider);
      await fetchOrCreateUserProfile(user);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
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
      } catch (error) {
        console.error('Error fetching user profile:', error);
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

// Helper function to get user-friendly error messages
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
    default:
      return 'A apărut o eroare. Încearcă din nou.';
  }
} 