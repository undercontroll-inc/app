import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setSplashVisible(false), 1600);
    return () => clearTimeout(timeout);
  }, []);

  if (splashVisible) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Image source={require('../assets/logo_pelluci.png')} resizeMode="contain" style={styles.logo} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splash: { alignItems: 'center', backgroundColor: '#061d2d', flex: 1, justifyContent: 'center' },
  logo: { height: 110, width: 220 },
});
