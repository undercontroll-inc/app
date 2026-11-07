import { Alert } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { requestRecordingPermissionsAsync } from "expo-audio";
import useComposerDictation from "../useComposerDictation";
import { transcriptionService } from "../../services/TranscriptionService";

const mockRecorder = {
  stop: jest.fn(async () => {}),
  record: jest.fn(),
  prepareToRecordAsync: jest.fn(async () => {}),
  getStatus: () => ({}),
  uri: "file:///cache/ana.m4a",
};

jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setAudioModeAsync: jest.fn(async () => {}),
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
}));
jest.mock("../../services/TranscriptionService", () => ({
  deleteRecordingFile: jest.fn(),
  transcriptionErrorMessage: (error) => error?.message || "Não foi possível transcrever.",
  transcriptionService: { transcribe: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  requestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
});

describe("useComposerDictation", () => {
  it("records, transcribes and hands the text to the composer", async () => {
    transcriptionService.transcribe.mockResolvedValue("Quais ordens estão pendentes?");
    const onText = jest.fn();
    const { result } = await renderHook(() => useComposerDictation({ onText }));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("recording");
    expect(mockRecorder.record).toHaveBeenCalledWith({ forDuration: 60 });

    await act(async () => {
      await result.current.finish();
    });

    expect(transcriptionService.transcribe).toHaveBeenCalledWith("file:///cache/ana.m4a");
    expect(onText).toHaveBeenCalledWith("Quais ordens estão pendentes?");
    expect(result.current.status).toBe("idle");
  });

  it("cancels without transcribing", async () => {
    const onText = jest.fn();
    const { result } = await renderHook(() => useComposerDictation({ onText }));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.cancel();
    });

    expect(mockRecorder.stop).toHaveBeenCalled();
    expect(transcriptionService.transcribe).not.toHaveBeenCalled();
    expect(onText).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("stays idle and explains when the microphone permission is denied", async () => {
    requestRecordingPermissionsAsync.mockResolvedValue({ granted: false });
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { result } = await renderHook(() => useComposerDictation({ onText: jest.fn() }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("idle");
    expect(mockRecorder.record).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Microfone bloqueado", expect.any(String), expect.any(Array));
    alert.mockRestore();
  });

  it("exposes a friendly error when the transcription fails", async () => {
    transcriptionService.transcribe.mockRejectedValue(new Error("A transcrição demorou demais."));
    const onText = jest.fn();
    const { result } = await renderHook(() => useComposerDictation({ onText }));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.finish();
    });

    await waitFor(() => expect(result.current.error).toBe("A transcrição demorou demais."));
    expect(onText).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });
});
