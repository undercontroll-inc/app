import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import useAnaChat from "../useAnaChat";
import { queryKeys } from "../queries/keys";
import { chatService } from "../../services/ChatService";
import { ApiError } from "../../providers/apiError";
import { createTestQueryClient } from "../../test/renderWithProviders";

jest.mock("../../services/ChatService", () => ({
  chatService: { streamMessage: jest.fn(), getMessages: jest.fn(), listConversations: jest.fn() },
}));

let client;

function renderChat(conversationId = "app-conv-1", options = { isNew: true }) {
  client = createTestQueryClient();
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useAnaChat(conversationId, options), { wrapper });
}

function streamWith(events) {
  chatService.streamMessage.mockImplementation(async ({ onEvent }) => {
    events.forEach((event) => onEvent(event));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  chatService.getMessages.mockResolvedValue({ notModified: false, etag: '"e1"', items: [], nextCursor: null });
  chatService.listConversations.mockResolvedValue({ items: [], nextCursor: null });
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
    const { result } = await renderChat();

    await act(async () => {
      result.current.send("Oi Ana");
    });

    await waitFor(() => expect(result.current.messages[1].status).toBe("partial"));
    const [user, assistant] = result.current.messages;
    expect(user).toMatchObject({ role: "user", content: "Oi Ana" });
    expect(assistant).toMatchObject({ content: "Olá, tudo bem", reason: "max_tokens", retryable: true });
    expect(result.current.sending).toBe(false);
    expect(chatService.streamMessage.mock.calls[0][0].conversationId).toBe("app-conv-1");
  });

  it("marks a stream that ends without a terminal event as partial instead of complete", async () => {
    streamWith([{ event: "delta", data: { content: "Resposta cortada" } }]);
    const { result } = await renderChat();

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
    const { result } = await renderChat();

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
    const { result } = await renderChat();

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
    const { result } = await renderChat();

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

  it("loads the stored history and does not duplicate messages after the turn is persisted", async () => {
    chatService.getMessages.mockResolvedValueOnce({
      notModified: false,
      etag: '"e1"',
      items: [
        { id: 1, role: "user", content: "Oi", state: "completed", reason: null, createdAt: "2026-11-06T10:00:00Z" },
        {
          id: 2,
          role: "assistant",
          content: "Olá!",
          state: "completed",
          reason: null,
          createdAt: "2026-11-06T10:00:02Z",
        },
      ],
      nextCursor: "older",
    });
    const { result } = await renderChat("app-conv-1", { isNew: false });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.hasOlder).toBe(true);

    streamWith([
      { event: "start", data: { conversationId: "app-conv-1", userMessageId: 3 } },
      { event: "delta", data: { content: "Tudo certo" } },
      { event: "done", data: { state: "completed", content: "Tudo certo", messageId: 4 } },
    ]);
    chatService.getMessages.mockResolvedValue({
      notModified: false,
      etag: '"e2"',
      items: [
        { id: 1, role: "user", content: "Oi", state: "completed", createdAt: "2026-11-06T10:00:00Z" },
        { id: 2, role: "assistant", content: "Olá!", state: "completed", createdAt: "2026-11-06T10:00:02Z" },
        { id: 3, role: "user", content: "E agora?", state: "completed", createdAt: "2026-11-06T10:05:00Z" },
        { id: 4, role: "assistant", content: "Tudo certo", state: "completed", createdAt: "2026-11-06T10:05:02Z" },
      ],
      nextCursor: "older",
    });

    await act(async () => {
      result.current.send("E agora?");
    });

    await waitFor(() => expect(chatService.getMessages).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.messages).toHaveLength(4));
    expect(result.current.messages.map((message) => message.content)).toEqual(["Oi", "Olá!", "E agora?", "Tudo certo"]);
    const list = client.getQueryData(queryKeys.chat.conversations);
    expect(list.pages[0].items[0]).toMatchObject({ conversationId: "app-conv-1", preview: "Tudo certo" });
  });

  it("sends the initial prompt of a new conversation once and adds it to the list", async () => {
    streamWith([
      { event: "start", data: { conversationId: "app-new", userMessageId: 10 } },
      { event: "done", data: { state: "completed", content: "Resposta", messageId: 11 } },
    ]);
    const { result } = await renderChat("app-new", { isNew: true, initialPrompt: "Quais ordens estão pendentes?" });

    await waitFor(() => expect(result.current.messages[1]?.status).toBe("complete"));
    expect(chatService.streamMessage).toHaveBeenCalledTimes(1);
    const list = client.getQueryData(queryKeys.chat.conversations);
    expect(list.pages[0].items[0]).toMatchObject({ conversationId: "app-new", title: "Quais ordens estão pendentes?" });
  });

  it("locks the composer when the conversation was deleted", async () => {
    chatService.streamMessage.mockRejectedValue(
      new ApiError({ status: 404, code: "CONVERSATION_NOT_FOUND", message: "not found" }),
    );
    const { result } = await renderChat();

    await act(async () => {
      result.current.send("Oi");
    });

    await waitFor(() => expect(result.current.deleted).toBe(true));
    expect(result.current.messages[1]).toMatchObject({ status: "error", retryable: false });
    expect(result.current.send("De novo")).toBe(false);
  });
});
