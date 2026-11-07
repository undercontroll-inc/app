import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Icon from "../ui/Icon";
import { colors, MAX_FONT_SCALE, shadow } from "../../theme";

export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  onInputLayout,
  disabled = false,
  nativeID = "chat-input",
}) {
  const canSend = !disabled && Boolean(value.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <TextInput
          editable={!disabled}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline
          nativeID={nativeID}
          onChangeText={onChangeText}
          onLayout={onInputLayout}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          placeholder="Pergunte algo à Ana"
          placeholderTextColor={colors.subtle}
          returnKeyType="send"
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityLabel="Enviar mensagem"
          disabled={!canSend}
          hitSlop={4}
          onPress={onSend}
          style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && canSend && styles.pressed]}
        >
          <Icon color="#ffffff" name="send" size={20} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  field: {
    alignItems: "center",
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 28,
    flexDirection: "row",
    minHeight: 56,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 4,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    maxHeight: 120,
    paddingRight: 10,
    paddingVertical: 10,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
