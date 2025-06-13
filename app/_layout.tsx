import { Stack } from 'expo-router';
import { AuthProvider } from '../components/auth/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="song" options={{ headerShown: false }} />
        <Stack.Screen name="pay" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
