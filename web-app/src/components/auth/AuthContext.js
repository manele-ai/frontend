import { signInAnonymously } from 'firebase/auth';
import { createContext, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';

/**
 * @type {import('react').Context<{
 *   user: import('firebase/auth').User | null | undefined;
 *   loading: boolean;
 *   error: Error | undefined;
 * }>}
 */
const AuthContext = createContext(/** @type {any} */ (null));

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    // When loading is finished and there's no user, sign in anonymously.
    // This works with the emulator as well.
    if (!loading && !user) {
      signInAnonymously(auth).catch((authError) => {
        console.error("Anonymous sign-in failed:", authError);
      });
    }
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 