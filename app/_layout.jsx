import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { queryClient, subscribeAppFocus } from "../providers/queryClient";

export default function RootLayout() {
  useEffect(() => subscribeAppFocus(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider preload={false}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </KeyboardProvider>
    </QueryClientProvider>
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splash: { alignItems: "center", backgroundColor: "#061d2d", flex: 1, justifyContent: "center" },
  logo: { height: 110, width: 220 },
});
