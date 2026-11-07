import { Pressable, StyleSheet, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "./ui/Icon";
import Text from "./ui/Text";
import { colors, shadowStrong } from "../theme";

const items = [
  { label: "Consertos", icon: "wrench", route: "/orders" },
  { label: "Estoque", icon: "box", route: "/stock" },
  { label: "Clientes", icon: "users", route: "/clients" },
  { label: "Painel", icon: "chart", route: "/dashboard" },
  { label: "Ana AI", icon: "sparkles", route: "/chat" },
];

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname.startsWith(item.route);
          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={item.label}
              onPress={() => router.replace(item.route)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>
                <Icon color={active ? colors.orange : colors.onNavyMuted} name={item.icon} size={22} />
              </View>
              <Text
                numberOfLines={1}
                tone={active ? "accent" : colors.onNavyMuted}
                variant="footnote"
                weight={active ? "700" : "500"}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 6 },
  nav: {
    ...shadowStrong,
    backgroundColor: colors.navy,
    borderRadius: 24,
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  item: { alignItems: "center", flex: 1, gap: 2, minHeight: 56, minWidth: 0 },
  iconPill: { alignItems: "center", borderRadius: 16, height: 32, justifyContent: "center", width: 56 },
  iconPillActive: { backgroundColor: "rgba(239,127,25,0.18)" },
  pressed: { opacity: 0.65 },
});
