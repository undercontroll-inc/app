import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

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
          multiline
          nativeID={nativeID}
          onChangeText={onChangeText}
          onLayout={onInputLayout}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          placeholder="Pergunte algo à Ana"
          placeholderTextColor="#9aaac0"
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
          <Feather color="#ffffff" name="arrow-up" size={22} />
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
    backgroundColor: "#ffffff",
    borderColor: "#dce4ee",
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 4,
  },
  input: {
    color: "#092542",
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingRight: 10,
    paddingVertical: 10,
  },
  send: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
