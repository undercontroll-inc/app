import { Pressable, StyleSheet, TextInput, View } from "react-native";
import ChatDictationBar from "./ChatDictationBar";
import Icon from "../ui/Icon";
import { colors, MAX_FONT_SCALE, shadow } from "../../theme";

export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  onInputLayout,
  disabled = false,
  nativeID = "chat-input",
  dictation,
  onMicPress,
}) {
  const hasText = Boolean(value.trim());
  const canSend = !disabled && hasText;
  const dictating = dictation && dictation.status !== "idle";
  const showMic = !hasText && Boolean(onMicPress);

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        {dictating ? (
          <ChatDictationBar dictation={dictation} />
        ) : (
          <>
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
            {showMic ? (
              <Pressable
                accessibilityHint="Grave sua pergunta e ela vira texto"
                accessibilityLabel="Falar com a Ana"
                accessibilityRole="button"
                disabled={disabled}
                hitSlop={4}
                onPress={onMicPress}
                style={({ pressed }) => [styles.send, disabled && styles.sendDisabled, pressed && styles.pressed]}
                testID="composer-mic"
              >
                <Icon color="#ffffff" name="mic" size={20} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Enviar mensagem"
                accessibilityRole="button"
                disabled={!canSend}
                hitSlop={4}
                onPress={onSend}
                style={({ pressed }) => [
                  styles.send,
                  !canSend && styles.sendDisabled,
                  pressed && canSend && styles.pressed,
                ]}
                testID="composer-send"
              >
                <Icon color="#ffffff" name="send" size={20} weight="bold" />
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 8, paddingHorizontal: 20, paddingTop: 8 },
  field: {
    ...shadow,
    alignItems: "center",
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
  sendDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
});
