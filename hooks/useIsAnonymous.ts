import { useAuth } from '../components/auth/AuthContext';

export function useIsAnonymous() {
  const { user } = useAuth();
  return user?.isAnonymous ?? false;
} 