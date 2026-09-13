import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

export default function AppShell({ children }) {
  return (
    <SafeAreaView collapsable={false} edges={["top"]} style={styles.safeArea}>
      <StatusBar style="light" />
      <View collapsable={false} style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#092542", flex: 1 },
  content: { backgroundColor: "#ffffff", flex: 1 },
});
