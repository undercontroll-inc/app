import { Pressable, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { haptics } from "../../utils/haptics";

export default function HeaderIconButton({ icon, label, onPress, testID }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon color="#ffffff" name={icon} size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  pressed: { opacity: 0.6 },
});
