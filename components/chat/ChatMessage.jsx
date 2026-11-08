import { Fragment, memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ChatBubble from "./ChatBubble";
import ThinkingIndicator from "./ThinkingIndicator";
import TypingIndicator from "./TypingIndicator";
import Icon from "../ui/Icon";
import { colors } from "../../theme";
import { useMarkdown } from "react-native-marked";
import { normalizeMarkdown, partialNotice } from "../../utils/chat";

const markdownStyles = {
  text: { color: "#092542", fontSize: 17, lineHeight: 25 },
  paragraph: { marginBottom: 4, marginTop: 0 },
  strong: { color: "#092542", fontWeight: "700" },
  em: { color: "#092542", fontStyle: "italic" },
  link: { color: "#0645b4" },
  h1: { color: "#092542", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  h2: { color: "#092542", fontSize: 19, fontWeight: "700", marginBottom: 8 },
  h3: { color: "#092542", fontSize: 17, fontWeight: "700", marginBottom: 6 },
  codespan: { backgroundColor: "#e4eaf1", color: "#092542", fontFamily: "Menlo" },
  code: { backgroundColor: "#e4eaf1", borderRadius: 10, padding: 12 },
  codeText: { color: "#092542", fontFamily: "Menlo", fontSize: 15 },
  list: { marginBottom: 8 },
  li: { color: "#092542", fontSize: 17, lineHeight: 25 },
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
          hitSlop={10}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Icon color={colors.orange} name="refresh" size={16} />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DateLabel({ label }) {
  if (!label) return null;
  return (
    <Text accessibilityRole="header" style={styles.dateLabel}>
      {label}
    </Text>
  );
}

function ChatMessage({ message, onRetry, onLongPress }) {
  return (
    <>
      <DateLabel label={message.dateLabel} />
      <MessageBody message={message} onLongPress={onLongPress} onRetry={onRetry} />
    </>
  );
}

function MessageBody({ message, onRetry, onLongPress }) {
  const longPress = onLongPress && message.content ? () => onLongPress(message) : undefined;
  const grouped = Boolean(message.groupedWithNext);

  if (message.role === "user") {
    return (
      <ChatBubble
        accessibilityLabel={`Você: ${message.content}`}
        grouped={grouped}
        onLongPress={longPress}
        side="right"
        tone="user"
      >
        <Text style={styles.userText}>{message.content}</Text>
      </ChatBubble>
    );
  }

  const retry = message.retryable && onRetry ? () => onRetry(message) : undefined;

  if (message.status === "error" && !message.content) {
    return (
      <ChatBubble side="left" tone="error">
        <Text style={styles.errorText}>{message.errorMessage || "Não foi possível responder."}</Text>
        {retry ? <Notice onRetry={retry} text="" tone="error" /> : null}
      </ChatBubble>
    );
  }

  if (message.status === "pending" && !message.content) {
    return (
      <ChatBubble side="left" tone="assistant">
        <ThinkingIndicator prompt={message.prompt} startedAt={message.createdAt} />
      </ChatBubble>
    );
  }

  const streaming = message.status === "pending" || message.status === "streaming";

  return (
    <ChatBubble
      accessibilityLabel={`Ana: ${message.content}`}
      onLongPress={streaming ? undefined : longPress}
      grouped={grouped}
      side="left"
      tone="assistant"
      wide
    >
      {streaming ? (
        <Text style={markdownStyles.text}>{message.content}</Text>
      ) : (
        <MarkdownContent content={message.content} id={message.id} />
      )}
      {streaming ? <TypingIndicator /> : null}
      {message.status === "partial" ? <Notice onRetry={retry} text={partialNotice(message.reason)} /> : null}
      {message.status === "error" ? <Notice onRetry={retry} text={message.errorMessage} tone="error" /> : null}
    </ChatBubble>
  );
}

export default memo(ChatMessage);

const styles = StyleSheet.create({
  userText: { color: "#ffffff", fontSize: 17, lineHeight: 24 },
  dateLabel: {
    alignSelf: "center",
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 6,
  },
  errorText: { color: colors.danger, fontSize: 17, lineHeight: 24 },
  notice: {
    borderTopColor: "rgba(9,37,66,0.12)",
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
  },
  noticeText: { color: colors.muted, fontSize: 15 },
  noticeError: { color: colors.danger },
  retry: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, minHeight: 36 },
  retryText: { color: colors.orange, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
