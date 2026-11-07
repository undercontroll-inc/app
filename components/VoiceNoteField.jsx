import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Icon from "./ui/Icon";
import Text from "./ui/Text";
import VoiceNoteSheet from "./VoiceNoteSheet";
import { colors, MAX_FONT_SCALE, radius } from "../theme";

export default function VoiceNoteField({ label, value, onChangeText, placeholder, field, voice }) {
  const state = voice.stateFor(field);
  const status = state?.status || "idle";
  const sheetOpen = status !== "idle";
  const transcribing = status === "transcribing";
  const empty = !String(value || "").trim();

  return (
    <View style={styles.field}>
      <Text tone="muted" variant="subhead" weight="600">
        {label}
      </Text>
      <View style={styles.box}>
        <TextInput
          editable={!transcribing}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          style={styles.input}
          textAlignVertical="top"
          value={value}
        />
        <View style={styles.toolbar}>
          <Pressable
            accessibilityLabel="Gravar áudio"
            disabled={state?.disabled}
            accessibilityRole="button"
            onPress={() => voice.start(field)}
            style={({ pressed }) => [styles.mic, state?.disabled && styles.micDisabled, pressed && styles.pressed]}
          >
            <Icon color={state?.disabled ? colors.subtle : colors.orange} name="mic" size={18} />
            <Text tone={state?.disabled ? "subtle" : "accent"} variant="subhead" weight="700">
              Gravar áudio
            </Text>
          </Pressable>
        </View>
      </View>
      <VoiceNoteSheet
        fieldEmpty={empty}
        fieldLabel={label}
        onClose={voice.cancel}
        onDraftChange={voice.setDraftText}
        onInsert={voice.applyInsert}
        onReplace={voice.applyReplace}
        onRerecord={voice.rerecord}
        onRetry={voice.record}
        onStart={voice.record}
        onStop={voice.stop}
        onTranscribe={voice.transcribe}
        onUse={voice.applyUse}
        state={state}
        visible={sheetOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 110,
    paddingBottom: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  toolbar: {
    alignItems: "flex-end",
    borderTopColor: colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 6,
  },
  mic: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  micDisabled: { backgroundColor: colors.surfaceMuted },
  pressed: { opacity: 0.72 },
});
