import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAbortError, normalizeError } from "../providers/api";
import { chatService } from "../services/ChatService";
import {
  CHAT_ERROR_MESSAGES,
  applyChatEvent,
  conversationTitle,
  createMessage,
  finalizeStream,
  isTerminalStatus,
  mergeMessages,
  messagePreview,
  replaceMessage,
} from "../utils/chat";
import { queryKeys } from "./queries/keys";
import { upsertConversation, useConversationMessages } from "./queries/useChatHistory";

const BUSY_COOLDOWN_MS = 5000;

function isWaiting(message) {
  return message.role === "assistant" && (message.status === "pending" || message.status === "streaming");
}

export default function useAnaChat(conversationId, { isNew = false, initialPrompt } = {}) {
  const queryClient = useQueryClient();
  const [live, setLive] = useState([]);
  const [busyNotice, setBusyNotice] = useState("");
  const [persisted, setPersisted] = useState(!isNew);
  const [deleted, setDeleted] = useState(false);
  const streamAbort = useRef(null);
  const requestId = useRef(0);
  const pendingChunk = useRef("");
  const frame = useRef(null);
  const sendingRef = useRef(false);
  const initialSent = useRef(false);

  const historyQuery = useConversationMessages(conversationId, { enabled: persisted });
  const messages = useMemo(() => mergeMessages(historyQuery.history, live), [historyQuery.history, live]);
  const sending = live.some(isWaiting) || Boolean(busyNotice);

  useEffect(() => {
    sendingRef.current = sending;
  });

  useEffect(
    () => () => {
      requestId.current += 1;
      streamAbort.current?.abort();
      if (frame.current != null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  useEffect(() => {
    if (!busyNotice) return undefined;
    const timeout = setTimeout(() => setBusyNotice(""), BUSY_COOLDOWN_MS);
    return () => clearTimeout(timeout);
  }, [busyNotice]);

  const finishTurn = useCallback(
    (prompt, answer) => {
      const now = new Date().toISOString();
      const existing = queryClient
        .getQueryData(queryKeys.chat.conversations)
        ?.pages?.flatMap((page) => page.items ?? [])
        .find((item) => item.conversationId === conversationId);
      upsertConversation(queryClient, {
        conversationId,
        title: existing?.title || conversationTitle(prompt),
        preview: messagePreview(answer || prompt),
        messageCount: (existing?.messageCount ?? 0) + (answer ? 2 : 1),
        lastMessageAt: now,
        createdAt: existing?.createdAt ?? now,
      });
      setPersisted(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations, refetchType: "none" });
    },
    [conversationId, queryClient],
  );

  const runStream = useCallback(
    async (prompt, assistantId, userId) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      streamAbort.current?.abort();
      const controller = new AbortController();
      streamAbort.current = controller;
      const isCurrent = () => requestId.current === currentRequest;
      let answer = "";
      let stored = false;

      const update = (id, updater) => {
        if (!isCurrent()) return;
        setLive((current) => replaceMessage(current, id, updater));
      };

      const flush = () => {
        if (frame.current != null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
        }
        const chunk = pendingChunk.current;
        pendingChunk.current = "";
        if (chunk)
          update(assistantId, (message) => applyChatEvent(message, { event: "delta", data: { content: chunk } }));
      };

      try {
        await chatService.streamMessage({
          content: prompt,
          conversationId,
          signal: controller.signal,
          onEvent: (event) => {
            if (!isCurrent()) return;
            if (event.event === "delta") {
              answer += event.data?.content ?? "";
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
              stored = true;
              const serverId = event.data?.userMessageId;
              if (serverId != null && userId) update(userId, (message) => ({ ...message, serverId }));
              return;
            }
            if (event.event !== "done" && event.event !== "partial" && event.event !== "error") return;
            if (event.data?.content) answer = event.data.content;
            flush();
            update(assistantId, (message) => applyChatEvent(message, event));
          },
        });
        flush();
        update(assistantId, finalizeStream);
      } catch (error) {
        flush();
        if (!isCurrent()) return;
        if (isAbortError(error)) {
          update(assistantId, (message) => (isTerminalStatus(message.status) ? message : finalizeStream(message)));
          return;
        }
        const apiError = normalizeError(error);
        const busy = apiError.code === "CHAT_CONVERSATION_BUSY";
        if (busy) setBusyNotice(CHAT_ERROR_MESSAGES.CHAT_CONVERSATION_BUSY);
        if (apiError.code === "CONVERSATION_NOT_FOUND") setDeleted(true);
        update(assistantId, (message) => ({
          ...message,
          status: "error",
          code: apiError.code,
          errorMessage: CHAT_ERROR_MESSAGES[apiError.code] || apiError.message,
          retryable: busy || (apiError.retryable && apiError.code !== "CONVERSATION_NOT_FOUND"),
        }));
      } finally {
        if (streamAbort.current === controller) streamAbort.current = null;
        if (isCurrent() && stored) finishTurn(prompt, answer.trim());
      }
    },
    [conversationId, finishTurn],
  );

  const send = useCallback(
    (text) => {
      const content = String(text || "").trim();
      if (!content || sendingRef.current || deleted) return false;
      sendingRef.current = true;
      const userMessage = createMessage({ role: "user", content });
      const assistantMessage = { ...createMessage({ role: "assistant", status: "pending" }), prompt: content };
      setLive((current) => [...current, userMessage, assistantMessage]);
      runStream(content, assistantMessage.id, userMessage.id);
      return true;
    },
    [deleted, runStream],
  );

  const retry = useCallback(
    (message) => {
      if (!message?.prompt || !message.retryable || sendingRef.current) return;
      sendingRef.current = true;
      setLive((current) =>
        replaceMessage(current, message.id, (item) => ({
          id: item.id,
          role: item.role,
          prompt: item.prompt,
          content: "",
          status: "pending",
          createdAt: item.createdAt,
        })),
      );
      runStream(message.prompt, message.id, null);
    },
    [runStream],
  );

  useEffect(() => {
    if (!initialPrompt || initialSent.current) return;
    initialSent.current = true;
    send(initialPrompt);
  }, [initialPrompt, send]);

  return {
    messages,
    sending,
    busyNotice,
    deleted,
    send,
    retry,
    loadingHistory: persisted && historyQuery.isPending,
    historyError: historyQuery.isError ? historyQuery.error : null,
    refetchHistory: historyQuery.refetch,
    loadOlder: historyQuery.fetchNextPage,
    hasOlder: Boolean(historyQuery.hasNextPage),
    loadingOlder: historyQuery.isFetchingNextPage,
  };
}
