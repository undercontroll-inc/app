import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import ChatComposerDock from "../../../components/chat/ChatComposerDock";
import ChatSuggestions from "../../../components/chat/ChatSuggestions";
import { openConversation } from "../../../components/chat/navigation";
import HeaderIconButton from "../../../components/chat/HeaderIconButton";
import RecentConversations from "../../../components/chat/RecentConversations";
import { useHideTabBarWithKeyboard } from "../../../components/chat/useChatChrome";
import HeaderAvatar from "../../../components/ui/HeaderAvatar";
import { headerCustomOptions } from "../../../components/ui/headerItems";
import Icon from "../../../components/ui/Icon";
import Text from "../../../components/ui/Text";
import { useChatSuggestions, useRefreshChatSuggestions } from "../../../hooks/queries/useChatSuggestions";
import { getErrorMessage } from "../../../providers/api";
import { createConversationId } from "../../../utils/chat";
import { haptics } from "../../../utils/haptics";
import { colors } from "../../../theme";

export default function ChatHomeScreen() {
  const [draft, setDraft] = useState("");
  const keyboardVisible = useHideTabBarWithKeyboard();
  const suggestionsQuery = useChatSuggestions();
  const refreshMutation = useRefreshChatSuggestions();
  const suggestionsError = refreshMutation.isError
    ? getErrorMessage(refreshMutation.error)
    : suggestionsQuery.isError
      ? getErrorMessage(suggestionsQuery.error)
      : "";

  const startConversation = useCallback((text) => {
    const prompt = String(text || "").trim();
    if (!prompt) return false;
    haptics.light();
    router.push({
      pathname: "/chat/[conversationId]",
      params: { conversationId: createConversationId(), prompt, isNew: "1" },
    });
    return true;
  }, []);

  const handleSend = useCallback(() => {
    if (startConversation(draft)) setDraft("");
  }, [draft, startConversation]);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={headerCustomOptions(
          <View style={styles.headerRight}>
            <HeaderIconButton
              icon="clock"
              label="Histórico de conversas"
              onPress={() => router.push("/chat/history")}
              testID="chat-history"
            />
            <HeaderAvatar />
          </View>,
        )}
      />
      <KeyboardAwareScrollView
        bottomOffset={80}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.flex}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon color={colors.orange} name="sparkles" size={34} />
          </View>
          <Text align="center" variant="title">
            Olá! Eu sou a Ana
          </Text>
          <Text align="center" tone="muted" variant="callout">
            Pergunte sobre ordens, estoque, clientes ou preços de mercado.
          </Text>
        </View>
        <ChatSuggestions
          error={suggestionsError}
          loading={suggestionsQuery.isPending}
          onRefresh={() => refreshMutation.mutate()}
          onSelect={startConversation}
          refreshing={refreshMutation.isPending}
          suggestions={suggestionsQuery.data ?? []}
        />
        <RecentConversations onOpen={openConversation} onSeeAll={() => router.push("/chat/history")} />
      </KeyboardAwareScrollView>
      <ChatComposerDock keyboardVisible={keyboardVisible} onChangeText={setDraft} onSend={handleSend} value={draft} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24, paddingTop: 24 },
  hero: { alignItems: "center", gap: 8, marginBottom: 28, paddingHorizontal: 32 },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    marginBottom: 8,
    width: 88,
  },
  headerRight: { alignItems: "center", flexDirection: "row" },
});
