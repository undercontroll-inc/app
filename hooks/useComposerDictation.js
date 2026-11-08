import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, Platform } from "react-native";
import { useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { deleteRecordingFile, transcriptionErrorMessage, transcriptionService } from "../services/TranscriptionService";
import {
  MAX_RECORDING_SECONDS,
  RECORDING_OPTIONS,
  prepareRecording,
  recordingUri,
  releaseRecordingMode,
  showMicPermissionAlert,
} from "../utils/audioRecording";
import { haptics } from "../utils/haptics";

const ERROR_VISIBLE_MS = 4000;

export default function useComposerDictation({ onText } = {}) {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const seenRecording = useRef(false);
  const finishing = useRef(false);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(""), ERROR_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const stopRecorder = useCallback(async () => {
    try {
      await recorder.stop();
    } catch {
      // Already stopped.
    }
    seenRecording.current = false;
    const uri = recordingUri(recorder);
    await releaseRecordingMode();
    return uri;
  }, [recorder]);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    if (Platform.OS === "web") {
      Alert.alert("Indisponível no navegador", "Grave o áudio pelo app no celular.");
      return;
    }
    setError("");
    try {
      const ready = await prepareRecording(recorder);
      if (!ready) {
        showMicPermissionAlert("Para falar com a Ana, permita o uso do microfone nos Ajustes.");
        return;
      }
      seenRecording.current = false;
      finishing.current = false;
      recorder.record({ forDuration: MAX_RECORDING_SECONDS });
      haptics.medium();
      setStatus("recording");
      AccessibilityInfo.announceForAccessibility?.("Gravando. Fale sua pergunta.");
    } catch (err) {
      setStatus("idle");
      setError(transcriptionErrorMessage(err));
    }
  }, [recorder, status]);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    const current = requestId.current + 1;
    requestId.current = current;
    haptics.light();
    const uri = await stopRecorder();
    setStatus("transcribing");
    AccessibilityInfo.announceForAccessibility?.("Transcrevendo");
    try {
      if (!uri) throw new Error("Não foi possível salvar o áudio.");
      const text = await transcriptionService.transcribe(uri);
      if (requestId.current !== current) return;
      if (!text) throw new Error("Não entendi o áudio. Tente falar de novo.");
      onTextRef.current?.(text);
      haptics.success();
    } catch (err) {
      if (requestId.current !== current) return;
      haptics.error();
      setError(transcriptionErrorMessage(err));
    } finally {
      deleteRecordingFile(uri);
      if (requestId.current === current) setStatus("idle");
      finishing.current = false;
    }
  }, [stopRecorder]);

  const cancel = useCallback(async () => {
    requestId.current += 1;
    finishing.current = false;
    if (status === "recording") {
      const uri = await stopRecorder();
      deleteRecordingFile(uri);
    }
    haptics.light();
    setStatus("idle");
    AccessibilityInfo.announceForAccessibility?.("Gravação cancelada");
  }, [status, stopRecorder]);

  useEffect(() => {
    if (recorderState.isRecording) {
      seenRecording.current = true;
      return;
    }
    if (seenRecording.current && status === "recording") finish();
  }, [finish, recorderState.isRecording, status]);

  useEffect(
    () => () => {
      requestId.current += 1;
      if (seenRecording.current) recorder.stop().catch(() => {});
      deleteRecordingFile(recordingUri(recorder));
    },
    [recorder],
  );

  return {
    status,
    error,
    durationMs: status === "recording" ? recorderState.durationMillis || 0 : 0,
    metering: recorderState.metering,
    remainingSeconds: Math.max(MAX_RECORDING_SECONDS - Math.floor((recorderState.durationMillis || 0) / 1000), 0),
    start,
    finish,
    cancel,
  };
}
