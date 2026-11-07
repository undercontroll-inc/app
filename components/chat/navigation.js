import { router } from "expo-router";

export function openConversation(conversation) {
  router.push({ pathname: "/chat/[conversationId]", params: { conversationId: conversation.conversationId } });
}

export function goChatHome() {
  router.dismissTo("/chat");
}
