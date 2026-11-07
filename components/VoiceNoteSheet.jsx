import { useEffect, useId, useRef } from "react";
import { router } from "expo-router";
import { clearVoiceSheet, setVoiceSheet } from "../utils/voiceSheetStore";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AudioReviewBar from "./AudioReviewBar";
import AudioWaveform from "./AudioWaveform";
import RecordButton from "./RecordButton";
import Icon from "./ui/Icon";
import Button from "./ui/Button";
import Text from "./ui/Text";
import { bottomDockPadding } from "../utils/layout";
import { haptics } from "../utils/haptics";
import { colors, MAX_FONT_SCALE, radius } from "../theme";

export function titleFor(status) {
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

export function VoiceNoteContent({
  fieldLabel,
  fieldEmpty,
  state,
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
  const status = state?.status || "idle";
  return (
    <>
      {fieldLabel ? (
        <Text tone="muted" variant="subhead">
          {fieldLabel}
        </Text>
      ) : null}

      {status === "ready" || status === "recording" ? (
        <View style={styles.body}>
          <AudioWaveform active={status === "recording"} metering={state.metering} tick={state.durationMs} />
          <View style={styles.timerRow}>
            {status === "recording" ? <View style={styles.liveDot} /> : null}
            <Text
              align="center"
              style={styles.timer}
              tone={status === "recording" ? "default" : "subtle"}
              variant="title"
            >
              {formatTimer(status === "recording" ? state.durationMs : 0)}
            </Text>
          </View>
          <RecordButton
            onPress={() => {
              if (status === "recording") {
                haptics.light();
                onStop();
              } else {
                haptics.medium();
                onStart();
              }
            }}
            recording={status === "recording"}
          />
          <Text align="center" tone="muted" variant="subhead">
            {status === "recording" ? "Toque para parar" : "Toque para começar a gravar"}
          </Text>
        </View>
      ) : null}

      {status === "review" && state.uri ? (
        <View style={styles.body}>
          <AudioReviewBar durationMs={state.durationMs} uri={state.uri} />
          <Button icon={{ sf: "text.bubble.fill", feather: "type" }} label="Transcrever" onPress={onTranscribe} />
          <Button label="Gravar de novo" onPress={onRerecord} size="md" variant="plain" />
        </View>
      ) : null}

      {status === "transcribing" ? (
        <View style={styles.center}>
          {Platform.OS === "ios" ? (
            <Icon
              animationSpec={{
                repeating: true,
                speed: 1,
                variableAnimationSpec: { iterative: true, dimInactiveLayers: true },
              }}
              color={colors.orange}
              size={56}
              sf="waveform"
            />
          ) : (
            <ActivityIndicator color={colors.orange} size="large" />
          )}
          <Text tone="muted" variant="callout">
            Transformando sua fala em texto…
          </Text>
        </View>
      ) : null}

      {status === "draft" ? (
        <View style={styles.body}>
          <TextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            multiline
            onChangeText={onDraftChange}
            style={styles.draftInput}
            textAlignVertical="top"
            value={state.draftText}
          />
          {fieldEmpty ? (
            <Button label="Usar transcrição" onPress={onUse} />
          ) : (
            <View style={styles.row}>
              <Button label="Inserir no texto" onPress={onInsert} style={styles.rowButton} variant="secondary" />
              <Button label="Substituir" onPress={onReplace} style={styles.rowButton} />
            </View>
          )}
        </View>
      ) : null}

      {status === "error" ? (
        <View style={styles.body}>
          <Button label="Tentar de novo" onPress={onRetry} />
        </View>
      ) : null}

      {state?.errorMessage ? (
        <Text style={styles.error} tone="danger" variant="subhead" weight="600">
          {state.errorMessage}
        </Text>
      ) : null}
    </>
  );
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
  const owner = useId();
  const opened = useRef(false);
  const previousStatus = useRef(status);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    if (visible) {
      setVoiceSheet({
        owner,
        title: titleFor(status),
        canClose,
        onClose,
        props: {
          fieldEmpty,
          fieldLabel,
          onDraftChange,
          onInsert,
          onReplace,
          onRerecord,
          onRetry,
          onStart,
          onStop,
          onTranscribe,
          onUse,
          state,
        },
      });
      if (!opened.current) {
        opened.current = true;
        router.push("/orders/voice-note");
      }
    } else if (opened.current) {
      opened.current = false;
      clearVoiceSheet(owner);
    }
  });

  useEffect(() => {
    if (previousStatus.current === "transcribing" && status === "draft") haptics.success();
    if (previousStatus.current !== "error" && status === "error") haptics.error();
    previousStatus.current = status;
  }, [status]);

  const dismissOnOverlay = status === "ready" || status === "review" || status === "draft" || status === "error";

  const content = (
    <VoiceNoteContent
      fieldEmpty={fieldEmpty}
      fieldLabel={fieldLabel}
      onDraftChange={onDraftChange}
      onInsert={onInsert}
      onReplace={onReplace}
      onRerecord={onRerecord}
      onRetry={onRetry}
      onStart={onStart}
      onStop={onStop}
      onTranscribe={onTranscribe}
      onUse={onUse}
      state={state}
    />
  );

  if (Platform.OS === "ios") return null;

  return (
    <Modal animationType="slide" onRequestClose={canClose ? onClose : undefined} transparent visible={visible}>
      <KeyboardAvoidingView style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar"
          disabled={!dismissOnOverlay}
          onPress={dismissOnOverlay ? onClose : undefined}
          style={styles.overlayDismiss}
        />
        <View style={[styles.sheet, { paddingBottom: bottomDockPadding(insets) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              disabled={!canClose}
              hitSlop={10}
              onPress={onClose}
              style={[styles.headerAction, !canClose && styles.dim]}
            >
              <Text tone="accent" variant="body">
                Cancelar
              </Text>
            </Pressable>
          </View>
          <Text variant="title2">{titleFor(status)}</Text>
          {content}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: 4,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    marginTop: 8,
    width: 40,
  },
  header: { alignItems: "center", flexDirection: "row", minHeight: 44 },
  headerAction: { justifyContent: "center", minHeight: 44 },
  dim: { opacity: 0.4 },
  body: { gap: 12, marginTop: 16 },
  center: { alignItems: "center", gap: 12, paddingVertical: 28 },
  timer: { fontVariant: ["tabular-nums"] },
  timerRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" },
  liveDot: { backgroundColor: colors.danger, borderRadius: 5, height: 10, width: 10 },
  draftInput: {
    backgroundColor: colors.background,
    borderRadius: radius.control,
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    maxHeight: 220,
    minHeight: 140,
    padding: 14,
  },
  row: { flexDirection: "row", gap: 10 },
  rowButton: { flex: 1 },
  error: { marginTop: 12 },
});
