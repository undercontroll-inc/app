import { Fragment, memo, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useMarkdown } from "react-native-marked";
import { normalizeMarkdown, partialNotice } from "../../utils/chat";

const markdownStyles = {
  text: { color: "#092542", fontSize: 16, lineHeight: 24 },
  paragraph: { marginBottom: 8, marginTop: 0 },
  strong: { color: "#092542", fontWeight: "700" },
  em: { color: "#092542", fontStyle: "italic" },
  link: { color: "#0645b4" },
  h1: { color: "#092542", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  h2: { color: "#092542", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  h3: { color: "#092542", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  codespan: { backgroundColor: "#e4eaf1", color: "#092542", fontFamily: "Menlo" },
  code: { backgroundColor: "#e4eaf1", borderRadius: 10, padding: 12 },
  codeText: { color: "#092542", fontFamily: "Menlo", fontSize: 13 },
  list: { marginBottom: 8 },
  li: { color: "#092542", fontSize: 16, lineHeight: 24 },
  blockquote: { borderLeftColor: "#ef7f19", borderLeftWidth: 3, paddingLeft: 12 },
};

const MarkdownContent = memo(function MarkdownContent({ id, content }) {
  const markdownValue = useMemo(() => normalizeMarkdown(content), [content]);
  const elements = useMarkdown(markdownValue, {
    colorScheme: "light",
    styles: markdownStyles,
  });
  return elements.map((element, index) => <Fragment key={`${id}-${index}`}>{element}</Fragment>);
});

function Notice({ text, tone, onRetry }) {
  return (
    <View style={styles.notice}>
      {text ? <Text style={[styles.noticeText, tone === "error" && styles.noticeError]}>{text}</Text> : null}
      {onRetry ? (
        <Pressable
          accessibilityLabel="Tentar novamente"
          hitSlop={6}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Feather color="#ef7f19" name="rotate-cw" size={14} />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChatMessage({ message, onRetry }) {
  if (message.role === "user") {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const retry = message.retryable && onRetry ? () => onRetry(message) : undefined;

  if (message.status === "error" && !message.content) {
    return (
      <View style={styles.assistantRow}>
        <View style={styles.errorBubble}>
          <Text style={styles.errorText}>{message.errorMessage || "Não foi possível responder."}</Text>
          {retry ? <Notice onRetry={retry} text="" tone="error" /> : null}
        </View>
      </View>
    );
  }

  if (message.status === "pending" && !message.content) {
    return (
      <View style={styles.assistantRow}>
        <View style={styles.assistantBubble}>
          <View style={styles.pending}>
            <ActivityIndicator color="#ef7f19" />
            <Text style={styles.pendingText}>Ana está pensando…</Text>
          </View>
        </View>
      </View>
    );
  }

  const streaming = message.status === "pending" || message.status === "streaming";

  return (
    <View style={styles.assistantRow}>
      <View style={styles.assistantBubble}>
        {streaming ? (
          <>
            <Text style={markdownStyles.text}>{message.content}</Text>
            <ActivityIndicator color="#ef7f19" style={styles.streamHint} />
          </>
        ) : (
          <MarkdownContent content={message.content} id={message.id} />
        )}
        {message.status === "partial" ? <Notice onRetry={retry} text={partialNotice(message.reason)} /> : null}
        {message.status === "error" ? <Notice onRetry={retry} text={message.errorMessage} tone="error" /> : null}
      </View>
    </View>
  );
}

export default memo(ChatMessage);

const styles = StyleSheet.create({
  userRow: {
    alignItems: "flex-end",
    marginBottom: 12,
    paddingLeft: 48,
    width: "100%",
  },
  userBubble: {
    backgroundColor: "#ef7f19",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
  },
  assistantRow: {
    alignItems: "flex-start",
    marginBottom: 12,
    paddingRight: 36,
    width: "100%",
  },
  assistantBubble: {
    backgroundColor: "#f1f4f8",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pending: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  pendingText: {
    color: "#667994",
    fontSize: 15,
  },
  streamHint: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  errorBubble: {
    backgroundColor: "#fdecee",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notice: {
    borderTopColor: "#dce4ee",
    borderTopWidth: 1,
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
  },
  noticeText: { color: "#667994", fontSize: 13 },
  noticeError: { color: "#d71929" },
  retry: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, paddingVertical: 2 },
  retryText: { color: "#ef7f19", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.72 },
  errorText: {
    color: "#d71929",
    fontSize: 15,
    lineHeight: 22,
  },
});
