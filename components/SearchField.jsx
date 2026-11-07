import { StyleSheet, TextInput, View } from "react-native";
import Icon from "./ui/Icon";
import { colors, MAX_FONT_SCALE, radius, shadow } from "../theme";

export default function SearchField({ value, onChangeText, placeholder, autoFocus }) {
  return (
    <View style={styles.search}>
      <Icon color={colors.muted} name="search" size={18} />
      <TextInput
        autoCorrect={false}
        autoFocus={autoFocus}
        clearButtonMode="while-editing"
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: "center",
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  input: { color: colors.text, flex: 1, fontSize: 17, paddingVertical: 10 },
});
