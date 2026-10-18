import { act, renderHook, waitFor } from "@testing-library/react-native";
import useAnaChat from "../useAnaChat";
import { chatService } from "../../services/ChatService";
import { ApiError } from "../../providers/apiError";

jest.mock("../../services/ChatService", () => ({ chatService: { streamMessage: jest.fn() } }));

function streamWith(events) {
  chatService.streamMessage.mockImplementation(async ({ onEvent }) => {
    events.forEach((event) => onEvent(event));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useAnaChat", () => {
  it("streams deltas and keeps the partial answer retryable", async () => {
    streamWith([
      { event: "start", data: { conversationId: "server-conv_1" } },
      { event: "status", data: { phase: "generating" } },
      { event: "delta", data: { content: "Olá, " } },
      { event: "delta", data: { content: "tudo bem" } },
      { event: "partial", data: { state: "partial", content: "Olá, tudo bem", reason: "max_tokens", retryable: true } },
    ]);
    const { result } = await renderHook(() => useAnaChat());

    await act(async () => {
      result.current.send("Oi Ana");
    });

    await waitFor(() => expect(result.current.messages[1].status).toBe("partial"));
    const [user, assistant] = result.current.messages;
    expect(user).toMatchObject({ role: "user", content: "Oi Ana" });
    expect(assistant).toMatchObject({ content: "Olá, tudo bem", reason: "max_tokens", retryable: true });
    expect(result.current.sending).toBe(false);
    expect(chatService.streamMessage.mock.calls[0][0].conversationId).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  });

  it("marks a stream that ends without a terminal event as partial instead of complete", async () => {
    streamWith([{ event: "delta", data: { content: "Resposta cortada" } }]);
    const { result } = await renderHook(() => useAnaChat());

    await act(async () => {
      result.current.send("Pergunta");
    });

    await waitFor(() => expect(result.current.messages[1].status).toBe("partial"));
    expect(result.current.messages[1]).toMatchObject({ content: "Resposta cortada", reason: "interrupted" });
  });

  it("maps error codes to friendly messages", async () => {
    streamWith([
      { event: "error", data: { state: "failed", code: "CHAT_TIMEOUT", message: "timeout", retryable: true } },
    ]);
    const { result } = await renderHook(() => useAnaChat());

    await act(async () => {
      result.current.send("Pergunta");
    });

    await waitFor(() => expect(result.current.messages[1].status).toBe("error"));
    expect(result.current.messages[1].errorMessage).toBe("A Ana demorou demais para responder. Tente novamente.");
  });

  it("blocks sending while the conversation is busy", async () => {
    chatService.streamMessage.mockRejectedValue(
      new ApiError({ status: 409, code: "CHAT_CONVERSATION_BUSY", message: "busy" }),
    );
    const { result } = await renderHook(() => useAnaChat());

    await act(async () => {
      result.current.send("Pergunta");
    });

    await waitFor(() => expect(result.current.busyNotice).not.toBe(""));
    expect(result.current.sending).toBe(true);
    expect(result.current.send("Outra")).toBe(false);
    expect(chatService.streamMessage).toHaveBeenCalledTimes(1);
  });

  it("retries a failed answer in place with the original prompt", async () => {
    streamWith([{ event: "error", data: { code: "CHAT_UNAVAILABLE", message: "down", retryable: true } }]);
    const { result } = await renderHook(() => useAnaChat());

    await act(async () => {
      result.current.send("Pergunta");
    });
    await waitFor(() => expect(result.current.messages[1].status).toBe("error"));

    streamWith([{ event: "done", data: { state: "completed", content: "Agora sim" } }]);
    await act(async () => {
      result.current.retry(result.current.messages[1]);
    });

    await waitFor(() => expect(result.current.messages[1].status).toBe("complete"));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe("Agora sim");
    expect(chatService.streamMessage.mock.calls[1][0].content).toBe("Pergunta");
  });
});
