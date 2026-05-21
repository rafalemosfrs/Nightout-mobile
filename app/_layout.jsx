import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

function RootNavigator() {
  useProtectedRoute();

  return (
    <>
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="login" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="register" options={{ headerShown: false }} />
  <Stack.Screen name="dashboards" options={{ headerShown: false }} />
  <Stack.Screen name="+not-found" />
</Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.frameworkReady?.();
    }
  }, []);

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
