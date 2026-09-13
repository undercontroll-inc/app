import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ScreenHeader({ title, badge, onClose, closeLabel = "Fechar" }) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>
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
          <Feather color="#ffffff" name="x" size={26} />
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
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    paddingRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "#0645b4",
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
    marginTop: 0,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  closeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pressed: { opacity: 0.72 },
});
