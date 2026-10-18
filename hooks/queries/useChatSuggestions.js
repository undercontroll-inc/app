import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../services/ChatService";
import { unwrapSuggestions } from "../../utils/chat";
import { queryKeys } from "./keys";

export function useChatSuggestions() {
  return useQuery({
    queryKey: queryKeys.chatSuggestions,
    queryFn: () => chatService.getSuggestions(),
    select: unwrapSuggestions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshChatSuggestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatService.refreshSuggestions(),
    onSuccess: (payload) => queryClient.setQueryData(queryKeys.chatSuggestions, payload),
  });
}
