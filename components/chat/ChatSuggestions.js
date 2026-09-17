import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function ChatSuggestions({ suggestions, loading, error, refreshing, onSelect, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={styles.title}>Sugestões para você</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Atualizar sugestões"
            disabled={refreshing || loading}
            hitSlop={8}
            onPress={onRefresh}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            {refreshing ? <ActivityIndicator color="#667994" /> : <Feather color="#667994" name="refresh-cw" size={18} />}
          </Pressable>
          <Pressable
            accessibilityLabel={collapsed ? "Mostrar sugestões" : "Ocultar sugestões"}
            hitSlop={8}
            onPress={() => setCollapsed((current) => !current)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Feather color="#667994" name={collapsed ? "chevron-up" : "chevron-down"} size={20} />
          </Pressable>
        </View>
      </View>
      {collapsed ? null : loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#ef7f19" />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.text)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <Text style={styles.cardText}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#092542",
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dce4ee",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardText: {
    color: "#092542",
    fontSize: 15,
    lineHeight: 22,
  },
  state: {
    alignItems: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  error: {
    color: "#d71929",
    fontSize: 14,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
