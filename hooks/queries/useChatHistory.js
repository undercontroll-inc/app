import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../services/ChatService";
import { normalizeError } from "../../providers/apiError";
import { PERSIST_MAX_AGE } from "../../providers/queryClient";
import { historyToMessages } from "../../utils/chat";
import { queryKeys } from "./keys";

const CONVERSATIONS_PAGE = 20;
const MESSAGES_PAGE = 50;

function conversationsQueryOptions() {
  return {
    queryKey: queryKeys.chat.conversations,
    queryFn: ({ pageParam, signal }) =>
      chatService.listConversations({ cursor: pageParam, limit: CONVERSATIONS_PAGE, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 30 * 1000,
    gcTime: PERSIST_MAX_AGE,
  };
}

export function messagesQueryOptions(queryClient, conversationId) {
  return {
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: async ({ pageParam, signal }) => {
      if (pageParam) {
        const page = await chatService.getMessages(conversationId, { cursor: pageParam, limit: MESSAGES_PAGE, signal });
        return { items: page.items, nextCursor: page.nextCursor, etag: page.etag };
      }
      const cached = queryClient.getQueryData(queryKeys.chat.messages(conversationId))?.pages?.[0];
      const page = await chatService.getMessages(conversationId, { limit: MESSAGES_PAGE, etag: cached?.etag, signal });
      if (page.notModified && cached) return cached;
      return { items: page.items ?? [], nextCursor: page.nextCursor ?? null, etag: page.etag };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 10 * 1000,
    gcTime: PERSIST_MAX_AGE,
  };
}

export function flattenConversations(data) {
  const seen = new Set();
  const list = [];
  for (const page of data?.pages ?? []) {
    for (const item of page.items ?? []) {
      if (seen.has(item.conversationId)) continue;
      seen.add(item.conversationId);
      list.push(item);
    }
  }
  return list;
}

export function flattenMessagePages(data) {
  const pages = data?.pages ?? [];
  const items = [];
  for (let index = pages.length - 1; index >= 0; index -= 1) items.push(...(pages[index].items ?? []));
  return historyToMessages(items);
}

export function useConversations() {
  const query = useInfiniteQuery(conversationsQueryOptions());
  const conversations = useMemo(() => flattenConversations(query.data), [query.data]);
  return { ...query, conversations };
}

export function useConversationMessages(conversationId, { enabled = true } = {}) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    ...messagesQueryOptions(queryClient, conversationId),
    enabled: enabled && !!conversationId,
  });
  const history = useMemo(() => flattenMessagePages(query.data), [query.data]);
  return { ...query, history };
}

export function usePrefetchConversation() {
  const queryClient = useQueryClient();
  return (conversationId) => queryClient.prefetchInfiniteQuery(messagesQueryOptions(queryClient, conversationId));
}

function mapConversations(data, mapper) {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: mapper(page.items ?? []) })) };
}

export function upsertConversation(queryClient, summary) {
  queryClient.setQueryData(queryKeys.chat.conversations, (data) => {
    if (!data) return { pages: [{ items: [summary], nextCursor: null }], pageParams: [null] };
    const existing = flattenConversations(data).find((item) => item.conversationId === summary.conversationId);
    const merged = { ...existing, ...summary, title: existing?.title || summary.title };
    const withoutIt = mapConversations(data, (items) =>
      items.filter((item) => item.conversationId !== summary.conversationId),
    );
    const [first, ...rest] = withoutIt.pages;
    return { ...withoutIt, pages: [{ ...first, items: [merged, ...(first?.items ?? [])] }, ...rest] };
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, title }) => {
      try {
        return await chatService.renameConversation(conversationId, title);
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onMutate: async ({ conversationId, title }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.conversations });
      const previous = queryClient.getQueryData(queryKeys.chat.conversations);
      queryClient.setQueryData(queryKeys.chat.conversations, (data) =>
        mapConversations(data, (items) =>
          items.map((item) => (item.conversationId === conversationId ? { ...item, title } : item)),
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.chat.conversations, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId) => {
      try {
        await chatService.deleteConversation(conversationId);
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.conversations });
      const previous = queryClient.getQueryData(queryKeys.chat.conversations);
      queryClient.setQueryData(queryKeys.chat.conversations, (data) =>
        mapConversations(data, (items) => items.filter((item) => item.conversationId !== conversationId)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.chat.conversations, context.previous);
    },
    onSuccess: (_data, conversationId) => {
      queryClient.removeQueries({ queryKey: queryKeys.chat.messages(conversationId) });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations }),
  });
}
