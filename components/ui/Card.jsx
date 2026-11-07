import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, shadow } from "../../theme";

export default function Card({ children, onPress, onLongPress, style, padded = true, accessibilityLabel, testID }) {
  const content = [styles.card, padded && styles.padded, style];
  if (!onPress && !onLongPress) {
    return (
      <View style={content} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [...content, pressed && styles.pressed]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { ...shadow, backgroundColor: colors.surface, borderRadius: radius.card },
  padded: { padding: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
