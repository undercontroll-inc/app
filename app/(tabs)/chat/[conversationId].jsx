import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import ChatThread from "../../../components/chat/ChatThread";
import HeaderIconButton from "../../../components/chat/HeaderIconButton";
import { goChatHome } from "../../../components/chat/navigation";
import useRenameConversationPrompt from "../../../components/chat/useRenameConversationPrompt";
import Banner from "../../../components/ui/Banner";
import { useConversations } from "../../../hooks/queries/useChatHistory";
import useAnaChat from "../../../hooks/useAnaChat";
import { conversationTitle } from "../../../utils/chat";
import { colors } from "../../../theme";

export default function ConversationScreen() {
  const { conversationId, prompt, isNew } = useLocalSearchParams();
  const chat = useAnaChat(conversationId, { isNew: isNew === "1", initialPrompt: prompt });
  const { conversations } = useConversations();
  const [actionError, setActionError] = useState("");
  const renamePrompt = useRenameConversationPrompt({ onError: setActionError });
  const menu = useActionMenu();

  useEffect(() => {
    if (!actionError) return undefined;
    const timer = setTimeout(() => setActionError(""), 4000);
    return () => clearTimeout(timer);
  }, [actionError]);

  const conversation = conversations.find((item) => item.conversationId === conversationId);
  const title = conversation?.title || (prompt ? conversationTitle(prompt) : "Conversa");
  const canRename = Boolean(conversation) && !chat.deleted;

  const rename = useCallback(() => {
    if (conversation) renamePrompt.ask(conversation);
  }, [conversation, renamePrompt]);

  const { show } = menu;
  const openAndroidMenu = useCallback(() => {
    show({
      title,
      options: [
        { label: "Nova conversa", onPress: goChatHome },
        ...(canRename ? [{ label: "Renomear conversa", onPress: rename }] : []),
        { label: "Cancelar", cancel: true },
      ],
    });
  }, [canRename, rename, show, title]);

  const headerOptions = useMemo(
    () => ({
      title,
      headerRight: () => <HeaderIconButton icon="more" label="Mais opções" onPress={openAndroidMenu} />,
      unstable_headerRightItems: () => [
        {
          type: "menu",
          label: "Mais opções",
          accessibilityLabel: "Mais opções",
          icon: { type: "sfSymbol", name: "ellipsis.circle" },
          tintColor: "#ffffff",
          menu: {
            items: [
              {
                type: "action",
                label: "Nova conversa",
                icon: { type: "sfSymbol", name: "square.and.pencil" },
                onPress: goChatHome,
              },
              {
                type: "action",
                label: "Renomear conversa",
                description: canRename ? undefined : "Disponível após a primeira resposta",
                icon: { type: "sfSymbol", name: "pencil" },
                disabled: !canRename,
                onPress: rename,
              },
            ],
          },
        },
      ],
    }),
    [canRename, openAndroidMenu, rename, title],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={headerOptions} />
      {actionError ? (
        <View style={styles.banner}>
          <Banner message={actionError} tone="danger" />
        </View>
      ) : null}
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
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
      {renamePrompt.sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  banner: { paddingHorizontal: 16, paddingTop: 12 },
});
