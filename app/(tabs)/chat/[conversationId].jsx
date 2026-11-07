import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import ChatThread from "../../../components/chat/ChatThread";
import HeaderIconButton from "../../../components/chat/HeaderIconButton";
import { headerCustomOptions } from "../../../components/ui/headerItems";
import { goChatHome } from "../../../components/chat/navigation";
import { useConversations } from "../../../hooks/queries/useChatHistory";
import useAnaChat from "../../../hooks/useAnaChat";
import { conversationTitle } from "../../../utils/chat";
import { colors } from "../../../theme";

export default function ConversationScreen() {
  const { conversationId, prompt, isNew } = useLocalSearchParams();
  const chat = useAnaChat(conversationId, { isNew: isNew === "1", initialPrompt: prompt });
  const { conversations } = useConversations();
  const cachedTitle = conversations.find((item) => item.conversationId === conversationId)?.title;
  const title = cachedTitle || (prompt ? conversationTitle(prompt) : "Conversa");

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title,
          ...headerCustomOptions(<HeaderIconButton icon="newChat" label="Nova conversa" onPress={goChatHome} />),
        }}
      />
      <ChatThread
        busyNotice={chat.busyNotice}
        deleted={chat.deleted}
        hasOlder={chat.hasOlder}
        historyError={chat.historyError}
        loadingHistory={chat.loadingHistory}
        loadingOlder={chat.loadingOlder}
        messages={chat.messages}
        onLoadOlder={chat.loadOlder}
        onNewConversation={goChatHome}
        onRetry={chat.retry}
        onRetryHistory={chat.refetchHistory}
        onSend={chat.send}
        sending={chat.sending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
});
