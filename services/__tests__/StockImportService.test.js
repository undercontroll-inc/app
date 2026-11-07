import { fetch } from "expo/fetch";
import { convertFormDataAsync } from "expo/src/winter/fetch/convertFormData";
import { stockImportErrorMessage, stockImportService } from "../StockImportService";

const { installFormDataPatch } = jest.requireActual("expo/src/winter/FormData");
const RNFormData = jest.requireActual("react-native/Libraries/Network/FormData");
global.FormData = installFormDataPatch(RNFormData.default ?? RNFormData);

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri) => ({
    uri,
    exists: true,
    size: uri.includes("huge") ? 11 * 1024 * 1024 : 4096,
    bytes: jest.fn(async () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
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

describe("StockImportService.upload", () => {
  it("sends the invoice as the file part with its mime type", async () => {
    fetch.mockResolvedValue(jsonResponse(202, { id: 9, status: "PROCESSING" }));

    const dto = await stockImportService.upload({
      uri: "file:///cache/nota.jpg",
      name: "nota.jpg",
      mimeType: "image/jpeg",
    });

    expect(dto).toEqual({ id: 9, status: "PROCESSING" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/stock-imports$/);
    expect(init.method).toBe("POST");
    const { body } = await convertFormDataAsync(init.body, "test-boundary");
    const multipart = new TextDecoder().decode(body);
    expect(multipart).toContain('content-disposition: form-data; name="file"; filename="nota.jpg"');
    expect(multipart).toContain("content-type: image/jpeg");
  });

  it("infers the mime type from the extension when the picker does not report it", async () => {
    fetch.mockResolvedValue(jsonResponse(202, { id: 10, status: "PROCESSING" }));

    await stockImportService.upload({ uri: "file:///cache/nfe.xml", name: "nfe.xml" });

    const { body } = await convertFormDataAsync(fetch.mock.calls[0][1].body, "b");
    expect(new TextDecoder().decode(body)).toContain("content-type: application/xml");
  });

  it("rejects files over 10 MB before uploading", async () => {
    await expect(stockImportService.upload({ uri: "file:///cache/huge.pdf", name: "huge.pdf" })).rejects.toThrow(
      "10 MB",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("surfaces backend error codes with friendly messages", async () => {
    fetch.mockResolvedValue(
      jsonResponse(400, { status: 400, code: "STOCK_IMPORT_INVALID", message: "Unsupported file type" }),
    );

    const error = await stockImportService
      .upload({ uri: "file:///cache/nota.gif", name: "nota.gif", mimeType: "image/gif" })
      .catch((err) => err);

    expect(error).toMatchObject({ status: 400, code: "STOCK_IMPORT_INVALID" });
    expect(stockImportErrorMessage(error)).toBe("Formato não suportado. Envie foto, PDF ou XML da nota.");
    expect(stockImportErrorMessage({ code: "STOCK_IMPORT_UNAVAILABLE" })).toMatch(/indisponível/);
  });
});
