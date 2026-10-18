import { File } from "expo-file-system";
import { ApiError, authorizedFetch, getErrorMessage, isAbortError, parseApiError } from "../providers/api";

const TRANSCRIBE_TIMEOUT_MS = 60000;
const MIN_AUDIO_BYTES = 256;

export const RECORDING_FILE_NAME = "note.m4a";
export const RECORDING_MIME_TYPE = "audio/mp4";

const FALLBACK_MESSAGE = "Não foi possível transcrever. Digite ou tente de novo.";

const INVALID_AUDIO_MESSAGES = [
  [/does not match|unsupported|unrecognized/i, "O formato do áudio não foi reconhecido. Grave novamente."],
  [/8MB/i, "O áudio ficou grande demais. Grave um trecho menor."],
  [/longer than/i, "O áudio ficou longo demais. Grave até 60 segundos."],
  [/empty|required/i, "A gravação ficou vazia. Tente de novo."],
];

export function transcriptionErrorMessage(error) {
  if (error?.code === "TRANSCRIPTION_UNAVAILABLE") {
    return "A transcrição está indisponível no momento. Digite ou tente de novo.";
  }
  const message = error?.message || getErrorMessage(error);
  if (error?.code === "TRANSCRIPTION_INVALID" || error?.status === 400) {
    const match = INVALID_AUDIO_MESSAGES.find(([pattern]) => pattern.test(message));
    return match ? match[1] : FALLBACK_MESSAGE;
  }
  return message || FALLBACK_MESSAGE;
}

export function createAudioPart(file) {
  return {
    name: RECORDING_FILE_NAME,
    type: RECORDING_MIME_TYPE,
    bytes: () => file.bytes(),
  };
}

function unwrapText(payload) {
  if (payload == null) return "";
  if (typeof payload === "string") return payload.trim();
  const nested = payload.data ?? payload;
  const text = nested?.text ?? nested?.content ?? "";
  return String(text || "").trim();
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

export function deleteRecordingFile(uri) {
  if (!uri) return;
  try {
    new File(uri).delete();
  } catch {
    // Cache file; safe to ignore.
  }
}

async function openRecording(uri) {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error("Não foi possível ler o áudio gravado.");
  }
  if ((file.size ?? 0) < MIN_AUDIO_BYTES) {
    throw new Error("A gravação ficou vazia. Tente de novo.");
  }
  return file;
}

class TranscriptionService {
  async transcribe(uri) {
    const file = await openRecording(uri);
    const form = new FormData();
    form.append("audio", createAudioPart(file));

    const timeout = withTimeout(TRANSCRIBE_TIMEOUT_MS);
    try {
      const response = await authorizedFetch("/transcriptions", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
        signal: timeout.signal,
      });
      const payloadText = await response.text();
      if (!response.ok) {
        throw new ApiError(parseApiError(response.status, payloadText));
      }
      if (!payloadText) return "";
      try {
        return unwrapText(JSON.parse(payloadText));
      } catch {
        return unwrapText(payloadText);
      }
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error("A transcrição demorou demais. Tente um áudio mais curto.");
      }
      throw error;
    } finally {
      timeout.clear();
    }
  }
}

export const transcriptionService = new TranscriptionService();
