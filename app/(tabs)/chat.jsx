import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import {
  KeyboardAwareScrollView,
  KeyboardGestureArea,
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue, withTiming } from "react-native-reanimated";
import AppHeader from "../../components/AppHeader";
import AppShell from "../../components/AppShell";
import ChatComposer from "../../components/chat/ChatComposer";
import ChatMessage from "../../components/chat/ChatMessage";
import ChatScrollView from "../../components/chat/ChatScrollView";
import ChatSuggestions from "../../components/chat/ChatSuggestions";
import { useTabBarVisibility } from "../../contexts/TabBarVisibilityContext";
import { useChatSuggestions, useRefreshChatSuggestions } from "../../hooks/queries/useChatSuggestions";
import useAnaChat from "../../hooks/useAnaChat";
import { getErrorMessage } from "../../providers/api";

const MIN_INPUT_HEIGHT = 52;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { setHidden } = useTabBarVisibility();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const extraContentPadding = useSharedValue(0);
  const { messages, sending, busyNotice, send, retry, reset } = useAnaChat();
  const [draft, setDraft] = useState("");
  const suggestionsQuery = useChatSuggestions();
  const refreshMutation = useRefreshChatSuggestions();
  const suggestionsError = refreshMutation.isError
    ? getErrorMessage(refreshMutation.error)
    : suggestionsQuery.isError
      ? getErrorMessage(suggestionsQuery.error)
      : "";

  const hasThread = messages.length > 0;
  const maintainVisibleContentPosition = useMemo(
    () => ({
      animateAutoScrollToBottom: true,
      autoscrollToBottomThreshold: 0.2,
      startRenderingFromBottom: true,
    }),
    [],
  );
  const dockPadding = Platform.OS === "ios" && !keyboardVisible ? insets.bottom : 0;

  useEffect(() => {
    setHidden(keyboardVisible);
  }, [keyboardVisible, setHidden]);

  useFocusEffect(
    useCallback(() => {
      return () => setHidden(false);
    }, [setHidden]),
  );

  const refetchSuggestions = suggestionsQuery.refetch;
  const resetConversation = useCallback(() => {
    reset();
    setDraft("");
    refetchSuggestions();
  }, [refetchSuggestions, reset]);

  const sendMessage = useCallback(
    (text) => {
      if (send(text)) setDraft("");
    },
    [send],
  );

  const handleSend = useCallback(() => {
    sendMessage(draft);
  }, [draft, sendMessage]);

  const onInputLayout = useCallback(
    (event) => {
      const height = event.nativeEvent.layout.height;
      extraContentPadding.set(withTiming(Math.max(height - MIN_INPUT_HEIGHT, 0), { duration: 250 }));
    },
    [extraContentPadding],
  );

  const renderScrollComponent = useCallback(
    (props) => <ChatScrollView {...props} extraContentPadding={extraContentPadding} />,
    [extraContentPadding],
  );

  const renderItem = useCallback(({ item }) => <ChatMessage message={item} onRetry={retry} />, [retry]);

  const composer = (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }} style={[styles.composerDock, { paddingBottom: dockPadding }]}>
      {busyNotice ? <Text style={styles.busyNotice}>{busyNotice}</Text> : null}
      <ChatComposer
        disabled={sending}
        nativeID="chat-input"
        onChangeText={setDraft}
        onInputLayout={onInputLayout}
        onSend={handleSend}
        value={draft}
      />
    </KeyboardStickyView>
  );

  return (
    <AppShell>
      <AppHeader />
      {!hasThread ? (
        <View style={styles.thread}>
          <KeyboardAwareScrollView
            bottomOffset={80}
            contentContainerStyle={styles.emptyContent}
            keyboardShouldPersistTaps="handled"
            style={styles.thread}
          >
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons color="#ffffff" name="sparkles" size={28} />
              </View>
              <Text style={styles.heroTitle}>Ana AI</Text>
              <Text style={styles.heroSubtitle}>Sua assistente inteligente</Text>
            </View>
            <ChatSuggestions
              error={suggestionsError}
              loading={suggestionsQuery.isPending}
              onRefresh={() => refreshMutation.mutate()}
              onSelect={sendMessage}
              refreshing={refreshMutation.isPending}
              suggestions={suggestionsQuery.data ?? []}
            />
          </KeyboardAwareScrollView>
          {composer}
        </View>
      ) : (
        <View style={styles.thread}>
          <View style={styles.threadBar}>
            <Pressable
              accessibilityLabel="Nova conversa"
              hitSlop={8}
              onPress={resetConversation}
              style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}
            >
              <Feather color="#ef7f19" name="edit-3" size={18} />
            </Pressable>
          </View>
          <KeyboardGestureArea interpolator="ios" style={styles.thread} textInputNativeID="chat-input">
            <FlashList
              contentContainerStyle={styles.listContent}
              data={messages}
              drawDistance={250}
              getItemType={(item) => `${item.role}-${item.status}`}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              maintainVisibleContentPosition={maintainVisibleContentPosition}
              renderItem={renderItem}
              renderScrollComponent={renderScrollComponent}
            />
            {composer}
          </KeyboardGestureArea>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  thread: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 28,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    marginBottom: 16,
    width: 80,
  },
  heroTitle: {
    color: "#092542",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#667994",
    fontSize: 16,
  },
  threadBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  newChat: {
    alignItems: "center",
    backgroundColor: "#fff6ee",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  busyNotice: {
    color: "#c79200",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  composerDock: {
    backgroundColor: "#ffffff",
  },
  pressed: {
    opacity: 0.72,
  },
});
