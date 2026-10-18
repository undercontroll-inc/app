import { fetch } from "expo/fetch";
import { convertFormDataAsync } from "expo/src/winter/fetch/convertFormData";
import { transcriptionErrorMessage, transcriptionService } from "../TranscriptionService";

const { installFormDataPatch } = jest.requireActual("expo/src/winter/FormData");
const RNFormData = jest.requireActual("react-native/Libraries/Network/FormData");
global.FormData = installFormDataPatch(RNFormData.default ?? RNFormData);

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri) => ({
    uri,
    exists: true,
    size: 4096,
    bytes: jest.fn(async () => new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112])),
  })),
}));

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  fetch.mockReset();
});

describe("TranscriptionService", () => {
  it("uploads the recording as the audio part with an explicit audio/mp4 type", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { text: " Trocar o compressor " }));

    const text = await transcriptionService.transcribe("file:///cache/recording.m4a");

    expect(text).toBe("Trocar o compressor");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/transcriptions$/);
    const { body, boundary } = await convertFormDataAsync(init.body, "test-boundary");
    const multipart = new TextDecoder().decode(body);
    expect(boundary).toBe("test-boundary");
    expect(multipart).toContain('content-disposition: form-data; name="audio"; filename="note.m4a"');
    expect(multipart).toContain("content-type: audio/mp4");
    expect(multipart).toContain("ftyp");
  });

  it("explains a 400 caused by a declared type that contradicts the bytes", async () => {
    fetch.mockResolvedValue(
      jsonResponse(400, {
        status: 400,
        code: "TRANSCRIPTION_INVALID",
        message: "Declared type audio/mpeg does not match the audio content (m4a)",
      }),
    );

    const error = await transcriptionService.transcribe("file:///cache/recording.m4a").catch((err) => err);

    expect(error).toMatchObject({ status: 400, code: "TRANSCRIPTION_INVALID" });
    expect(transcriptionErrorMessage(error)).toBe("O formato do áudio não foi reconhecido. Grave novamente.");
  });

  it("maps the unavailable code and keeps local messages", () => {
    expect(transcriptionErrorMessage({ code: "TRANSCRIPTION_UNAVAILABLE", status: 503, message: "x" })).toBe(
      "A transcrição está indisponível no momento. Digite ou tente de novo.",
    );
    expect(transcriptionErrorMessage(new Error("A gravação ficou vazia. Tente de novo."))).toBe(
      "A gravação ficou vazia. Tente de novo.",
    );
  });
});
