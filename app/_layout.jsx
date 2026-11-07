import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { enableLegacyHeaderAppearance, Stack, useRouter, useSegments } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { persistOptions, queryClient, subscribeAppFocus } from "../providers/queryClient";

enableLegacyHeaderAppearance();

export default function RootLayout() {
  useEffect(() => subscribeAppFocus(), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <KeyboardProvider preload={false}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </KeyboardProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => setSplashVisible(false), 1200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loading || splashVisible) return;
    const inTabs = segments[0] === "(tabs)";
    if (isAuthenticated && !inTabs) {
      router.replace("/orders");
    } else if (!isAuthenticated && inTabs) {
      router.replace("/");
    }
  }, [loading, splashVisible, isAuthenticated, segments, router]);

  if (loading || splashVisible) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Image source={require("../assets/logo_pelluci.png")} resizeMode="contain" style={styles.logo} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { alignItems: "center", backgroundColor: "#061d2d", flex: 1, justifyContent: "center" },
  logo: { height: 110, width: 220 },
});
