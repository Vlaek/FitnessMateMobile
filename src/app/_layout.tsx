import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/shared/providers/app-providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="programs/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="programs/[programId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="workout" options={{ gestureEnabled: false }} />
        <Stack.Screen name="history/[workoutId]" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
