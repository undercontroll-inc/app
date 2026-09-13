import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getAxiosErrorMessage } from "../../providers/api";
import { chatService } from "../../services/ChatService";
import { createMessage, unwrapSuggestions } from "../../utils/chat";

const MIN_INPUT_HEIGHT = 52;

function isAbortError(error) {
  return error?.name === "AbortError" || /aborted|AbortError/i.test(String(error?.message || ""));
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { setHidden } = useTabBarVisibility();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const extraContentPadding = useSharedValue(0);
  const streamAbort = useRef(null);
  const requestId = useRef(0);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const sending = messages.some(
    (message) =>
      message.role === "assistant" &&
      (message.status === "pending" || message.status === "streaming"),
  );
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

  const loadSuggestions = useCallback(async () => {
    try {
      setSuggestionsError("");
      const payload = await chatService.getSuggestions();
      setSuggestions(unwrapSuggestions(payload));
    } catch (error) {
      setSuggestionsError(getAxiosErrorMessage(error));
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    setHidden(keyboardVisible);
  }, [keyboardVisible, setHidden]);

  useEffect(() => {
    return () => {
      requestId.current += 1;
      streamAbort.current?.abort();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => setHidden(false);
    }, [setHidden]),
  );

  const refreshSuggestions = useCallback(async () => {
    try {
      setRefreshing(true);
      setSuggestionsError("");
      const payload = await chatService.refreshSuggestions();
      setSuggestions(unwrapSuggestions(payload));
    } catch (error) {
      setSuggestionsError(getAxiosErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const resetConversation = useCallback(() => {
    requestId.current += 1;
    streamAbort.current?.abort();
    streamAbort.current = null;
    setMessages([]);
    setDraft("");
    setSuggestionsLoading(true);
    loadSuggestions();
  }, [loadSuggestions]);

  const sendMessage = useCallback(async (text) => {
    const content = String(text || "").trim();
    if (!content || sending) return;

    setDraft("");
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    streamAbort.current?.abort();
    const controller = new AbortController();
    streamAbort.current = controller;

    const userMessage = createMessage({ role: "user", content, status: "complete" });
    const assistantMessage = createMessage({ role: "assistant", content: "", status: "pending" });
    setMessages((current) => [...current, userMessage, assistantMessage]);

    const updateAssistant = (updater) => {
      if (requestId.current !== currentRequest) return;
      setMessages((current) =>
        current.map((message) => (message.id === assistantMessage.id ? updater(message) : message)),
      );
    };

    try {
      await chatService.streamMessage({
        content,
        signal: controller.signal,
        onEvent: (event) => {
          if (requestId.current !== currentRequest) return;
          if (event.event === "delta") {
            const chunk = event.data?.content ?? "";
            updateAssistant((message) => ({
              ...message,
              content: `${message.content}${chunk}`,
              status: "streaming",
            }));
            return;
          }
          if (event.event === "done") {
            const reply = event.data?.content;
            updateAssistant((message) => ({
              ...message,
              content: reply || message.content || "Não recebi uma resposta.",
              status: "complete",
            }));
            return;
          }
          if (event.event === "error") {
            updateAssistant((message) => ({
              ...message,
              content: event.data?.message || "Não foi possível responder.",
              status: "error",
            }));
          }
        },
      });
      updateAssistant((message) => {
        if (message.status === "complete" || message.status === "error") return message;
        return {
          ...message,
          content: message.content || "Não recebi uma resposta.",
          status: message.content ? "complete" : "error",
        };
      });
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      if (isAbortError(error)) {
        updateAssistant((message) =>
          message.status === "pending" || message.status === "streaming"
            ? {
                ...message,
                content: message.content || "Resposta interrompida.",
                status: message.content ? "complete" : "error",
              }
            : message,
        );
        return;
      }
      updateAssistant((message) => ({
        ...message,
        content: error?.message || getAxiosErrorMessage(error),
        status: "error",
      }));
    }
  }, [sending]);

  const handleSend = useCallback(() => {
    sendMessage(draft);
  }, [draft, sendMessage]);

  const onInputLayout = useCallback(
    (event) => {
      const height = event.nativeEvent.layout.height;
      extraContentPadding.value = withTiming(Math.max(height - MIN_INPUT_HEIGHT, 0), { duration: 250 });
    },
    [extraContentPadding],
  );

  const renderScrollComponent = useCallback(
    (props) => <ChatScrollView {...props} extraContentPadding={extraContentPadding} />,
    [extraContentPadding],
  );

  const renderItem = useCallback(({ item }) => <ChatMessage message={item} />, []);

  const composer = (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }} style={[styles.composerDock, { paddingBottom: dockPadding }]}>
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
              loading={suggestionsLoading}
              onRefresh={refreshSuggestions}
              onSelect={sendMessage}
              refreshing={refreshing}
              suggestions={suggestions}
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
  composerDock: {
    backgroundColor: "#ffffff",
  },
  pressed: {
    opacity: 0.72,
  },
});
