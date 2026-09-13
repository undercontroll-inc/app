import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import { getApiBaseURL } from "../providers/api";
import { getToken } from "../utils/auth";

const TRANSCRIBE_TIMEOUT_MS = 60000;
const MIN_AUDIO_BYTES = 256;

function parseApiErrorBody(text) {
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    return data.message || data.error || data.detail || data.code || text;
  } catch {
    return text;
  }
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
    form.append("audio", file, "note.m4a");

    const token = getToken();
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const timeout = withTimeout(TRANSCRIBE_TIMEOUT_MS);
    try {
      const response = await fetch(`${getApiBaseURL()}/transcriptions`, {
        method: "POST",
        headers,
        body: form,
        signal: timeout.signal,
      });
      const payloadText = await response.text();
      if (!response.ok) {
        throw new Error(parseApiErrorBody(payloadText) || `Erro ${response.status}`);
      }
      if (!payloadText) return "";
      try {
        return unwrapText(JSON.parse(payloadText));
      } catch {
        return unwrapText(payloadText);
      }
    } catch (error) {
      if (error?.name === "AbortError" || /aborted/i.test(String(error?.message || ""))) {
        throw new Error("A transcrição demorou demais. Tente um áudio mais curto.");
      }
      throw error;
    } finally {
      timeout.clear();
    }
  }
}

export const transcriptionService = new TranscriptionService();
