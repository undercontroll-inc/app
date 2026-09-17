import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ScreenHeader({ title, badge, onClose, closeLabel = "Fechar" }) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {!!badge && <Text style={styles.badge}>{badge}</Text>}
      </View>
      {onClose && (
        <Pressable
          accessibilityLabel={closeLabel}
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Feather color="#ffffff" name="x" size={22} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#092542",
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  title: {
    color: "#fff",
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#0645b4",
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  closeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pressed: { opacity: 0.72 },
});
