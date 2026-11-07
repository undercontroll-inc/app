import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../ui/Icon";
import { colors, shadow } from "../../theme";

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
            {refreshing ? (
              <ActivityIndicator color="#667994" />
            ) : (
              <Icon color={colors.muted} name="refresh" size={18} />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel={collapsed ? "Mostrar sugestões" : "Ocultar sugestões"}
            hitSlop={8}
            onPress={() => setCollapsed((current) => !current)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon color={colors.muted} name={collapsed ? "chevronDown" : "chevronUp"} size={16} />
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
    fontSize: 17,
    fontWeight: "600",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  list: {
    gap: 12,
  },
  card: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardText: {
    color: "#092542",
    fontSize: 17,
    lineHeight: 24,
  },
  state: {
    alignItems: "center",
    minHeight: 48,
    paddingVertical: 12,
  },
  error: {
    color: "#d71929",
    fontSize: 15,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
