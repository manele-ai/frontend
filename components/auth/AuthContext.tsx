import { signInAnonymously, User } from 'firebase/auth';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    // If there's no user and we're not loading, sign in anonymously
    if (!user && !loading) {
      signInAnonymously(auth).catch((error) => {
        console.error("Error signing in anonymously:", error);
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