import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/lab";
import { startSync } from "@/lib/outbox";
import { usePalette } from "@/ui/theme";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { status } = useAuth();
  const c = usePalette();
  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);
  useEffect(() => {
    if (status !== "signedIn") return;
    let stop: (() => void) | undefined;
    startSync().then((s) => (stop = s));
    return () => stop?.();
  }, [status]);
  if (status === "loading") return null;
  const signedIn = status === "signedIn";
  return (
    <Stack
      screenOptions={{
        headerTintColor: c.accentText,
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.textStrong },
        contentStyle: { backgroundColor: c.bg },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player/new" options={{ title: "Nouveau joueur", presentation: "modal" }} />
        <Stack.Screen name="player/[id]" options={{ title: "Fiche joueur" }} />
        <Stack.Screen name="match/prepare" options={{ title: "Préparer le match", presentation: "modal" }} />
        <Stack.Screen name="match/[id]" options={{ title: "Match" }} />
        <Stack.Screen name="match/evaluate" options={{ title: "Évaluation" }} />
        <Stack.Screen name="match/result" options={{ title: "Fin de match" }} />
        <Stack.Screen name="report/[id]" options={{ title: "Rapport" }} />
        <Stack.Screen name="sync" options={{ title: "Synchronisation", presentation: "modal" }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Navigator />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
