import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { KeyboardGestureArea } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, useSharedValue, withTiming } from "react-native-reanimated";
import ChatComposerDock from "./ChatComposerDock";
import ChatMessage from "./ChatMessage";
import ChatScrollView from "./ChatScrollView";
import { useHideTabBarWithKeyboard, useMessageActions } from "./useChatChrome";
import { ActionMenuSheet } from "../ActionMenu";
import Banner from "../ui/Banner";
import Icon from "../ui/Icon";
import StateView from "../ui/StateView";
import { getErrorMessage } from "../../providers/api";
import { decorateMessages } from "../../utils/chat";
import { haptics } from "../../utils/haptics";
import { colors, shadow } from "../../theme";

const MIN_INPUT_HEIGHT = 52;
const SHOW_JUMP_AT = 320;

export default function ChatThread({
  messages,
  sending,
  busyNotice,
  deleted,
  onSend,
  onRetry,
  onNewConversation,
  loadingHistory,
  historyError,
  onRetryHistory,
  onLoadOlder,
  hasOlder,
  loadingOlder,
}) {
  const listRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [showJump, setShowJump] = useState(false);
  const keyboardVisible = useHideTabBarWithKeyboard();
  const extraContentPadding = useSharedValue(0);
  const actions = useMessageActions(setDraft);
  const data = useMemo(() => decorateMessages(messages), [messages]);

  const maintainVisibleContentPosition = useMemo(
    () => ({ animateAutoScrollToBottom: true, autoscrollToBottomThreshold: 0.2, startRenderingFromBottom: true }),
    [],
  );

  const handleSend = useCallback(() => {
    if (onSend(draft)) setDraft("");
  }, [draft, onSend]);

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

  const renderItem = useCallback(
    ({ item }) => <ChatMessage message={item} onLongPress={actions.open} onRetry={onRetry} />,
    [actions.open, onRetry],
  );

  const onScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const next = distance > SHOW_JUMP_AT;
    setShowJump((current) => (current === next ? current : next));
  }, []);

  const onStartReached = useCallback(() => {
    if (hasOlder && !loadingOlder) onLoadOlder();
  }, [hasOlder, loadingOlder, onLoadOlder]);

  const jumpToEnd = useCallback(() => {
    haptics.light();
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  if (!data.length && (loadingHistory || historyError)) {
    return (
      <View style={styles.flex}>
        <StateView
          error={historyError ? getErrorMessage(historyError) : null}
          loading={loadingHistory}
          loadingText="Carregando conversa..."
          onRetry={onRetryHistory}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ActionMenuSheet config={actions.menu.config} onClose={actions.menu.close} />
      <KeyboardGestureArea interpolator="ios" style={styles.flex} textInputNativeID="chat-input">
        <FlashList
          ListHeaderComponent={loadingOlder ? <ActivityIndicator color={colors.orange} style={styles.older} /> : null}
          contentContainerStyle={styles.listContent}
          data={data}
          drawDistance={400}
          getItemType={(item) => `${item.role}-${item.status}-${item.dateLabel ? "d" : "n"}`}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={maintainVisibleContentPosition}
          onScroll={onScroll}
          onStartReached={onStartReached}
          onStartReachedThreshold={0.4}
          ref={listRef}
          renderItem={renderItem}
          renderScrollComponent={renderScrollComponent}
          scrollEventThrottle={64}
        />
        {showJump ? (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.jumpWrap}>
            <Pressable
              accessibilityLabel="Ir para a última mensagem"
              accessibilityRole="button"
              onPress={jumpToEnd}
              style={({ pressed }) => [styles.jump, pressed && styles.pressed]}
            >
              <Icon color={colors.navy} name="chevronDown" size={18} weight="bold" />
            </Pressable>
          </Animated.View>
        ) : null}
        {deleted ? (
          <View style={styles.deleted}>
            <Banner
              actionLabel="Começar nova conversa"
              message="Esta conversa foi excluída e não recebe novas mensagens."
              onAction={onNewConversation}
              tone="neutral"
            />
          </View>
        ) : (
          <ChatComposerDock
            busyNotice={busyNotice}
            disabled={sending}
            keyboardVisible={keyboardVisible}
            onChangeText={setDraft}
            onInputLayout={onInputLayout}
            onSend={handleSend}
            value={draft}
          />
        )}
      </KeyboardGestureArea>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },
  older: { marginBottom: 12 },
  jumpWrap: { alignItems: "center", bottom: 92, left: 0, position: "absolute", right: 0 },
  jump: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  deleted: { padding: 16, paddingBottom: 32 },
  pressed: { opacity: 0.7 },
});
