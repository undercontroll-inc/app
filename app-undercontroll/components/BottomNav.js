import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const items = [
  { label: "Consertos", icon: "tool", route: "/orders" },
  { label: "Estoque", icon: "package" },
  { label: "Clientes", icon: "users" },
  { label: "Dashboard", icon: "pie-chart" },
  { label: "Ang AI", icon: "zap" },
];

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.wrap, { marginBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = item.route && pathname.startsWith(item.route);
          return (
            <Pressable
              key={item.label}
              onPress={() => item.route && router.replace(item.route)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={styles.iconBox}>
                <Feather color={active ? "#ef7f19" : "#ffffff"} name={item.icon} size={22} />
              </View>
              <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
  },
  nav: {
    backgroundColor: "#092542",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  item: { alignItems: "center", flex: 1, minWidth: 0 },
  iconBox: { alignItems: "center", height: 24, justifyContent: "center", width: 24 },
  label: { color: "#ffffff", fontSize: 10, marginTop: 4, textAlign: "center" },
  active: { color: "#ef7f19", fontWeight: "700" },
  pressed: { opacity: 0.65 },
});
