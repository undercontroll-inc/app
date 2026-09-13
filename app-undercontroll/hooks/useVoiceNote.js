import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { getAxiosErrorMessage } from "../providers/api";
import { orderService } from "../services/OrderService";
import { deleteRecordingFile, transcriptionService } from "../services/TranscriptionService";

export const MAX_RECORDING_SECONDS = 60;

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function appendTranscribedText(current, incoming) {
  const next = String(incoming || "").trim();
  if (!next) return String(current || "");
  const prev = String(current || "").trimEnd();
  if (!prev) return next;
  return `${prev}\n${next}`;
}

function afterPaint() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

function transcriptionErrorMessage(error) {
  const api = error?.message || getAxiosErrorMessage(error);
  if (/demorou/i.test(api)) return api;
  const code = error?.response?.data?.code;
  if (code === "TRANSCRIPTION_UNAVAILABLE" || code === "TRANSCRIPTION_INVALID") {
    return "Não foi possível transcrever. Digite ou tente de novo.";
  }
  if (/unavailable|unsupported|empty|8MB|transcri/i.test(api)) {
    return "Não foi possível transcrever. Digite ou tente de novo.";
  }
  return api || "Não foi possível transcrever. Digite ou tente de novo.";
}

function showPermissionAlert() {
  Alert.alert(
    "Microfone bloqueado",
    "A transcrição precisa do microfone. Ative a permissão nos Ajustes para gravar observações.",
    [
      { text: "Agora não", style: "cancel" },
      { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
    ],
  );
}

export default function useVoiceNote({ edit = false, orderId } = {}) {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);
  const [activeField, setActiveField] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [patchWarning, setPatchWarning] = useState("");
  const [uri, setUri] = useState(null);
  const [durationMs, setDurationMs] = useState(0);
  const [draftText, setDraftText] = useState("");
  const pendingRef = useRef(null);
  const uriRef = useRef(null);
  const seenRecording = useRef(false);
  const stopping = useRef(false);
  const transcribingLock = useRef(false);
  uriRef.current = uri;

  const clearFile = useCallback((path) => {
    deleteRecordingFile(path);
    setUri(null);
    setDurationMs(0);
  }, []);

  const stopToReview = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    seenRecording.current = false;
    try {
      try {
        await recorder.stop();
      } catch {
        // Already stopped by forDuration.
      }
      const recStatus = recorder.getStatus();
      const nextUri = recorder.uri || recStatus?.url;
      if (!nextUri) {
        throw new Error("Não foi possível salvar o áudio.");
      }
      const elapsed = Math.max(recStatus?.durationMillis || (recorder.currentTime || 0) * 1000, 0);
      setUri(nextUri);
      setDurationMs(elapsed);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      setStatus("review");
      setErrorMessage("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(transcriptionErrorMessage(error));
    } finally {
      stopping.current = false;
    }
  }, [recorder]);

  useEffect(() => {
    if (recorderState.isRecording) {
      seenRecording.current = true;
      return;
    }
    if (seenRecording.current && status === "recording") {
      stopToReview();
    }
  }, [recorderState.isRecording, status, stopToReview]);

  useEffect(() => {
    return () => {
      if (seenRecording.current) {
        recorder.stop().catch(() => {});
      }
      deleteRecordingFile(uriRef.current);
    };
  }, [recorder]);

  const beginRecording = useCallback(
    async (field, { setValue, patchKey }) => {
      setErrorMessage("");
      setPatchWarning("");
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showPermissionAlert();
        return;
      }

      try {
        pendingRef.current = { setValue, patchKey };
        seenRecording.current = false;
        stopping.current = false;
        setActiveField(field);
        setStatus("recording");
        await setAudioModeAsync({
          allowsRecording: true,
          interruptionMode: "doNotMix",
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
        recorder.record({ forDuration: MAX_RECORDING_SECONDS });
      } catch (error) {
        setActiveField(field);
        setStatus("error");
        setErrorMessage(transcriptionErrorMessage(error));
      }
    },
    [recorder],
  );

  const start = useCallback((field, options) => {
    if (Platform.OS === "web") {
      Alert.alert("Indisponível no navegador", "Grave o áudio pelo app no celular.");
      return;
    }
    if (status !== "idle" && status !== "error") return;
    pendingRef.current = options;
    setActiveField(field);
    setErrorMessage("");
    setStatus("ready");
  }, [status]);

  const record = useCallback(async () => {
    if (status !== "ready" && status !== "error") return;
    const field = activeField;
    const pending = pendingRef.current;
    if (!field || !pending) return;
    await beginRecording(field, pending);
  }, [activeField, beginRecording, status]);

  const transcribe = useCallback(async () => {
    if (!uri || status !== "review" || transcribingLock.current) return;
    transcribingLock.current = true;
    setStatus("transcribing");
    setErrorMessage("");
    try {
      const text = await transcriptionService.transcribe(uri);
      if (!text) {
        throw new Error("Não foi possível transcrever. Digite ou tente de novo.");
      }
      clearFile(uri);
      setDraftText(text);
      setStatus("draft");
    } catch (error) {
      setStatus("review");
      setErrorMessage(transcriptionErrorMessage(error));
    } finally {
      transcribingLock.current = false;
    }
  }, [clearFile, status, uri]);

  const rerecord = useCallback(async () => {
    const path = uri;
    setUri(null);
    setDurationMs(0);
    setDraftText("");
    setErrorMessage("");
    setStatus("ready");
    await afterPaint();
    deleteRecordingFile(path);
  }, [uri]);

  const applyDraft = useCallback(
    async (mode) => {
      const pending = pendingRef.current;
      const text = String(draftText || "").trim();
      if (!pending?.setValue || !text) return;

      let nextValue = text;
      pending.setValue((current) => {
        nextValue = mode === "replace" ? text : appendTranscribedText(current, text);
        return nextValue;
      });

      if (edit && orderId && pending.patchKey) {
        try {
          await orderService.update(orderId, { [pending.patchKey]: nextValue });
          setPatchWarning("");
        } catch (error) {
          setPatchWarning(
            getAxiosErrorMessage(error) || "Texto aplicado, mas não foi possível salvar. Use o botão de salvar da OS.",
          );
        }
      }

      pendingRef.current = null;
      setDraftText("");
      setActiveField(null);
      setStatus("idle");
      setErrorMessage("");
    },
    [draftText, edit, orderId],
  );

  const cancel = useCallback(async () => {
    if (transcribingLock.current) return;
    stopping.current = true;
    seenRecording.current = false;
    const path = uri;
    if (recorder.isRecording) {
      try {
        await recorder.stop();
      } catch {
        // Already stopped.
      }
      const recStatus = recorder.getStatus();
      setUri(null);
      setDurationMs(0);
      setDraftText("");
      setActiveField(null);
      setStatus("idle");
      setErrorMessage("");
      pendingRef.current = null;
      stopping.current = false;
      await afterPaint();
      deleteRecordingFile(path);
      deleteRecordingFile(recorder.uri || recStatus?.url);
      return;
    }
    pendingRef.current = null;
    setUri(null);
    setDurationMs(0);
    setDraftText("");
    setActiveField(null);
    setStatus("idle");
    setErrorMessage("");
    stopping.current = false;
    await afterPaint();
    deleteRecordingFile(path);
  }, [recorder, uri]);

  const busy = status !== "idle";

  const stateFor = useCallback(
    (field) => {
      const active = activeField === field;
      return {
        status: active ? status : "idle",
        errorMessage: active ? errorMessage : "",
        durationMs: active ? durationMs || recorderState.durationMillis : 0,
        metering: active ? recorderState.metering : undefined,
        uri: active ? uri : null,
        draftText: active ? draftText : "",
        disabled: Platform.OS === "web" || (busy && !active),
      };
    },
    [activeField, busy, draftText, durationMs, errorMessage, recorderState.durationMillis, recorderState.metering, status, uri],
  );

  return {
    start,
    record,
    stop: stopToReview,
    transcribe,
    rerecord,
    applyInsert: () => applyDraft("insert"),
    applyReplace: () => applyDraft("replace"),
    applyUse: () => applyDraft("replace"),
    cancel,
    setDraftText,
    stateFor,
    patchWarning,
  };
}
