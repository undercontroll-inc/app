import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import VoiceNoteSheet from "./VoiceNoteSheet";

export default function VoiceNoteField({
  label,
  value,
  onChangeText,
  placeholder,
  state,
  onRecord,
  onStart,
  onStop,
  onTranscribe,
  onRerecord,
  onDraftChange,
  onInsert,
  onReplace,
  onUse,
  onCancel,
}) {
  const status = state?.status || "idle";
  const sheetOpen = status !== "idle";
  const transcribing = status === "transcribing";
  const empty = !String(value || "").trim();

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <TextInput
          editable={!transcribing}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667994"
          style={styles.input}
          textAlignVertical="top"
          value={value}
        />
        <View style={styles.toolbar}>
          <Pressable
            accessibilityLabel="Gravar áudio"
            disabled={state?.disabled}
            hitSlop={6}
            onPress={onRecord}
            style={({ pressed }) => [styles.mic, state?.disabled && styles.micDisabled, pressed && styles.pressed]}
          >
            <Feather color={state?.disabled ? "#9aaac0" : "#ef7f19"} name="mic" size={18} />
          </Pressable>
        </View>
      </View>
      <VoiceNoteSheet
        fieldEmpty={empty}
        fieldLabel={label}
        onClose={onCancel}
        onDraftChange={onDraftChange}
        onInsert={onInsert}
        onReplace={onReplace}
        onRerecord={onRerecord}
        onRetry={onStart}
        onStart={onStart}
        onStop={onStop}
        onTranscribe={onTranscribe}
        onUse={onUse}
        state={state}
        visible={sheetOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },
  label: {
    color: "#667994",
    fontSize: 14,
    marginBottom: 8,
  },
  box: {
    backgroundColor: "#ffffff",
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 2,
    overflow: "hidden",
  },
  input: {
    color: "#092542",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbar: {
    alignItems: "flex-end",
    borderTopColor: "#eef2f6",
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mic: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  micDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
