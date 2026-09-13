import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AudioReviewBar from "./AudioReviewBar";
import AudioWaveform from "./AudioWaveform";

function titleFor(status) {
  if (status === "ready") return "Gravar áudio";
  if (status === "recording") return "Gravando";
  if (status === "review") return "Ouvir gravação";
  if (status === "transcribing") return "Transcrevendo";
  if (status === "draft") return "Transcrição";
  return "Áudio";
}

function formatTimer(durationMs = 0) {
  const total = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function VoiceNoteSheet({
  visible,
  fieldLabel,
  fieldEmpty,
  state,
  onClose,
  onStart,
  onStop,
  onTranscribe,
  onRerecord,
  onDraftChange,
  onInsert,
  onReplace,
  onUse,
  onRetry,
}) {
  const insets = useSafeAreaInsets();
  const status = state?.status || "idle";
  const canClose = status !== "transcribing";
  const dismissOnOverlay = status === "ready" || status === "review" || status === "draft" || status === "error";

  return (
    <Modal animationType="slide" onRequestClose={canClose ? onClose : undefined} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable
          disabled={!dismissOnOverlay}
          onPress={dismissOnOverlay ? onClose : undefined}
          style={styles.overlayDismiss}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable disabled={!canClose} onPress={onClose} style={styles.headerAction}>
              <Text style={[styles.cancelText, !canClose && styles.cancelDisabled]}>Cancelar</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{titleFor(status)}</Text>
          {fieldLabel ? <Text style={styles.caption}>{fieldLabel}</Text> : null}

          {status === "ready" ? (
            <View style={styles.body}>
              <Pressable onPress={onStart} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>Começar a gravar</Text>
              </Pressable>
            </View>
          ) : null}

          {status === "recording" ? (
            <View style={styles.body}>
              <AudioWaveform active metering={state.metering} tick={state.durationMs} />
              <Text style={styles.timer}>{formatTimer(state.durationMs)}</Text>
              <Pressable onPress={onStop} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>Parar</Text>
              </Pressable>
            </View>
          ) : null}

          {status === "review" && state.uri ? (
            <View style={styles.body}>
              <AudioReviewBar durationMs={state.durationMs} uri={state.uri} />
              <Pressable onPress={onTranscribe} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>Transcrever</Text>
              </Pressable>
              <Pressable onPress={onRerecord} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
                <Text style={styles.textActionLabel}>Gravar de novo</Text>
              </Pressable>
            </View>
          ) : null}

          {status === "transcribing" ? (
            <View style={styles.center}>
              <ActivityIndicator color="#ef7f19" />
              <Text style={styles.hint}>Isso pode levar alguns segundos</Text>
            </View>
          ) : null}

          {status === "draft" ? (
            <View style={styles.body}>
              <TextInput
                multiline
                onChangeText={onDraftChange}
                style={styles.draftInput}
                textAlignVertical="top"
                value={state.draftText}
              />
              {fieldEmpty ? (
                <Pressable onPress={onUse} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                  <Text style={styles.primaryText}>Usar transcrição</Text>
                </Pressable>
              ) : (
                <View style={styles.row}>
                  <Pressable
                    onPress={onInsert}
                    style={({ pressed }) => [styles.secondary, styles.rowButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.secondaryText}>Inserir no texto</Text>
                  </Pressable>
                  <Pressable
                    onPress={onReplace}
                    style={({ pressed }) => [styles.primary, styles.rowButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.primaryText}>Substituir</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          {status === "error" ? (
            <View style={styles.body}>
              <Pressable onPress={onRetry} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>Tentar de novo</Text>
              </Pressable>
            </View>
          ) : null}

          {state?.errorMessage ? <Text style={styles.error}>{state.errorMessage}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#dce4ee",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    width: 36,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    paddingTop: 4,
  },
  headerAction: {
    paddingVertical: 8,
    paddingRight: 6,
  },
  cancelText: {
    color: "#667994",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelDisabled: {
    opacity: 0.4,
  },
  title: {
    color: "#092542",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  caption: {
    color: "#667994",
    fontSize: 13,
    marginTop: 4,
  },
  body: {
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  center: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 28,
  },
  hint: {
    color: "#667994",
    fontSize: 14,
  },
  timer: {
    color: "#092542",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  draftInput: {
    backgroundColor: "#f4f7fb",
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 1,
    color: "#092542",
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 180,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  rowButton: {
    flex: 1,
  },
  primary: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#ef7f19",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    alignItems: "center",
    borderColor: "#ef7f19",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  secondaryText: {
    color: "#ef7f19",
    fontSize: 15,
    fontWeight: "700",
  },
  textAction: {
    alignItems: "center",
    paddingVertical: 8,
  },
  textActionLabel: {
    color: "#d71929",
    fontSize: 14,
    fontWeight: "700",
  },
  error: {
    color: "#d71929",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});
