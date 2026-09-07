import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function BottomNav() {
  const items = [
    { label: "Consertos", icon: "tool", route: "/orders" },
    { label: "Estoque", icon: "package" },
    { label: "Clientes", icon: "users" },
    { label: "Dashboard", icon: "pie-chart" },
    { label: "Ang AI", icon: "zap" },
  ];
  return (
    <View style={styles.nav}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={() => item.route && item.route !== "/orders" && router.replace(item.route)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.iconBox}>
            <Feather color={index === 0 ? "#ef7f19" : "#ffffff"} name={item.icon} size={22} />
          </View>
          <Text style={[styles.label, index === 0 && styles.active]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "#092542",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 16,
    paddingTop: 12,
  },
  item: { alignItems: "center", minWidth: 54 },
  iconBox: { alignItems: "center", height: 24, justifyContent: "center", width: 24 },
  label: { color: "#ffffff", fontSize: 10, marginTop: 4 },
  active: { color: "#ef7f19", fontWeight: "700" },
  pressed: { opacity: 0.65 },
});
