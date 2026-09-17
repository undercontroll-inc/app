import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { formatUserName } from "../utils/orders";

function initials(client) {
  return formatUserName(client)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ClientCard({ client, onPress, onLongPress }) {
  return (
    <Pressable
      accessibilityLabel={formatUserName(client)}
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {client.avatarUrl ? (
        <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials(client)}</Text>
        </View>
      )}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {formatUserName(client)}
        </Text>
        <Text numberOfLines={1} style={styles.phone}>
          {client.phone || "Telefone não informado"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: { backgroundColor: "#dce4ee", borderRadius: 20, height: 40, width: 40 },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "#092542",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  copy: { flex: 1, marginLeft: 12 },
  name: { color: "#092542", fontSize: 16, fontWeight: "700" },
  phone: { color: "#667994", fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.75 },
});
