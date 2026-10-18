import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError, normalizeError } from "../providers/api";
import { chatService } from "../services/ChatService";
import {
  CHAT_ERROR_MESSAGES,
  applyChatEvent,
  createMessage,
  finalizeStream,
  isTerminalStatus,
  isValidConversationId,
  replaceMessage,
} from "../utils/chat";
import { loadConversationId, startConversation } from "../utils/conversation";

const BUSY_COOLDOWN_MS = 5000;

function isWaiting(message) {
  return message.role === "assistant" && (message.status === "pending" || message.status === "streaming");
}

export default function useAnaChat() {
  const [messages, setMessages] = useState([]);
  const [busyNotice, setBusyNotice] = useState("");
  const conversationRef = useRef(null);
  const streamAbort = useRef(null);
  const requestId = useRef(0);
  const pendingChunk = useRef("");
  const frame = useRef(null);
  const sendingRef = useRef(false);

  const sending = messages.some(isWaiting) || Boolean(busyNotice);

  useEffect(() => {
    sendingRef.current = sending;
  });

  useEffect(() => {
    let active = true;
    loadConversationId().then((id) => {
      if (active && !conversationRef.current) conversationRef.current = id;
    });
    return () => {
      active = false;
      requestId.current += 1;
      streamAbort.current?.abort();
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (!busyNotice) return undefined;
    const timeout = setTimeout(() => setBusyNotice(""), BUSY_COOLDOWN_MS);
    return () => clearTimeout(timeout);
  }, [busyNotice]);

  const runStream = useCallback(async (prompt, assistantId) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    streamAbort.current?.abort();
    const controller = new AbortController();
    streamAbort.current = controller;
    const isCurrent = () => requestId.current === currentRequest;

    const update = (updater) => {
      if (!isCurrent()) return;
      setMessages((current) => replaceMessage(current, assistantId, updater));
    };

    const flush = () => {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      const chunk = pendingChunk.current;
      pendingChunk.current = "";
      if (chunk) update((message) => applyChatEvent(message, { event: "delta", data: { content: chunk } }));
    };

    try {
      if (!conversationRef.current) conversationRef.current = await loadConversationId();
      await chatService.streamMessage({
        content: prompt,
        conversationId: conversationRef.current,
        signal: controller.signal,
        onEvent: (event) => {
          if (!isCurrent()) return;
          if (event.event === "delta") {
            pendingChunk.current += event.data?.content ?? "";
            if (frame.current == null) {
              frame.current = requestAnimationFrame(() => {
                frame.current = null;
                flush();
              });
            }
            return;
          }
          if (event.event === "start") {
            if (isValidConversationId(event.data?.conversationId)) conversationRef.current = event.data.conversationId;
            return;
          }
          if (event.event !== "done" && event.event !== "partial" && event.event !== "error") return;
          flush();
          update((message) => applyChatEvent(message, event));
        },
      });
      flush();
      update(finalizeStream);
    } catch (error) {
      flush();
      if (!isCurrent()) return;
      if (isAbortError(error)) {
        update((message) => (isTerminalStatus(message.status) ? message : finalizeStream(message)));
        return;
      }
      const apiError = normalizeError(error);
      const busy = apiError.code === "CHAT_CONVERSATION_BUSY";
      if (busy) setBusyNotice(CHAT_ERROR_MESSAGES.CHAT_CONVERSATION_BUSY);
      update((message) => ({
        ...message,
        status: "error",
        code: apiError.code,
        errorMessage: CHAT_ERROR_MESSAGES[apiError.code] || apiError.message,
        retryable: busy || apiError.retryable,
      }));
    } finally {
      if (streamAbort.current === controller) streamAbort.current = null;
    }
  }, []);

  const send = useCallback(
    (text) => {
      const content = String(text || "").trim();
      if (!content || sendingRef.current) return false;
      sendingRef.current = true;
      const userMessage = createMessage({ role: "user", content });
      const assistantMessage = { ...createMessage({ role: "assistant", status: "pending" }), prompt: content };
      setMessages((current) => [...current, userMessage, assistantMessage]);
      runStream(content, assistantMessage.id);
      return true;
    },
    [runStream],
  );

  const retry = useCallback(
    (message) => {
      if (!message?.prompt || !message.retryable || sendingRef.current) return;
      sendingRef.current = true;
      setMessages((current) =>
        replaceMessage(current, message.id, (item) => ({
          id: item.id,
          role: item.role,
          prompt: item.prompt,
          content: "",
          status: "pending",
        })),
      );
      runStream(message.prompt, message.id);
    },
    [runStream],
  );

  const reset = useCallback(async () => {
    requestId.current += 1;
    streamAbort.current?.abort();
    streamAbort.current = null;
    pendingChunk.current = "";
    setMessages([]);
    setBusyNotice("");
    sendingRef.current = false;
    conversationRef.current = await startConversation();
  }, []);

  return { messages, sending, busyNotice, send, retry, reset };
}
