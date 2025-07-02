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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../services/firebase';

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
  isAuthenticated: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) throw new Error('No user authenticated');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
      
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name in Firebase Auth
      await updateProfile(user, { displayName });

      // setUserProfile(profile); // profile is fetched onAuthStateChanged
      // return user; // REMOVE, should return void
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Fetch user profile
      await fetchUserProfile(user.uid);
      // setUserProfile(profile); // profile is fetched onAuthStateChanged
      // return user; // REMOVE, should return void
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
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists, if not create it
      let profile = await fetchUserProfile(user.uid);

      // setUserProfile(profile); // profile is fetched onAuthStateChanged
      // return user; // REMOVE, should return void
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
      if (user) {
        setUser(user);
        // Fetch user profile
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        setLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
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
    isAuthenticated: !!user
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