import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
      <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="song" options={{ headerShown: false }} />
      <Stack.Screen name="pay" options={{ headerShown: false }} />
      </Stack>
  );
}
