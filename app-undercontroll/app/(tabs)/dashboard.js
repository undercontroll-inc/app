import { StyleSheet, Text, View } from "react-native";
import AppShell from "../../components/AppShell";

export default function DashboardScreen() {
  return (
    <AppShell>
      <View style={styles.body}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.soon}>Em breve</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 24 },
  title: { color: "#092542", fontSize: 32, fontWeight: "800", marginBottom: 12 },
  soon: { color: "#667994", fontSize: 16 },
});
