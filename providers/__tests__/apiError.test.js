import { AxiosError } from "axios";
import { ApiError, FORBIDDEN_MESSAGE, NETWORK_ERROR_MESSAGE, normalizeError, parseApiError } from "../apiError";

describe("parseApiError", () => {
  it("reads the core-api error body with code", () => {
    const body = JSON.stringify({ status: 409, code: "AWAITING_DATA", message: "No snapshot published yet" });
    expect(parseApiError(409, body)).toEqual({
      status: 409,
      code: "AWAITING_DATA",
      message: "No snapshot published yet",
      retryable: false,
    });
  });

  it("joins field validation errors", () => {
    const body = { message: "Bad request", errors: [{ field: "content", message: "must not be blank" }] };
    expect(parseApiError(400, body).message).toBe("must not be blank");
  });

  it("replaces the 403 message with a permission message but keeps the code", () => {
    const body = { status: 403, code: "ORDER_UNAUTHORIZED", message: "Access Denied" };
    expect(parseApiError(403, body)).toMatchObject({ code: "ORDER_UNAUTHORIZED", message: FORBIDDEN_MESSAGE });
  });

  it("marks server errors as retryable and falls back to the status", () => {
    expect(parseApiError(503, "")).toEqual({ status: 503, code: null, message: "Erro 503", retryable: true });
    expect(parseApiError(502, "<html>bad gateway</html>").message).toBe("<html>bad gateway</html>");
  });
});

describe("normalizeError", () => {
  it("normalizes axios responses", () => {
    const error = new AxiosError("fail", "ERR_BAD_REQUEST", {}, null, {
      status: 503,
      data: { code: "INSIGHTS_DISABLED", message: "Insights disabled" },
    });
    expect(normalizeError(error)).toMatchObject({ status: 503, code: "INSIGHTS_DISABLED", retryable: true });
  });

  it("normalizes network failures", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK", {}, {});
    expect(normalizeError(error)).toMatchObject({ code: "NETWORK", message: NETWORK_ERROR_MESSAGE, retryable: true });
  });

  it("keeps ApiError instances and plain error messages", () => {
    const apiError = new ApiError({ status: 409, code: "CHAT_CONVERSATION_BUSY", message: "busy" });
    expect(normalizeError(apiError)).toBe(apiError);
    expect(normalizeError(new Error("Gravação vazia")).message).toBe("Gravação vazia");
  });
});
