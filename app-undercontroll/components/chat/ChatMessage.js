import { Fragment, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useMarkdown } from "react-native-marked";
import { normalizeMarkdown } from "../../utils/chat";

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

export default function ChatMessage({ message }) {
  const markdownValue = useMemo(
    () => normalizeMarkdown(message.content),
    [message.content],
  );
  const elements = useMarkdown(markdownValue, {
    colorScheme: "light",
    styles: markdownStyles,
  });
  const waiting = message.status === "pending" || message.status === "streaming";

  if (message.role === "user") {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  if (message.status === "error") {
    return (
      <View style={styles.assistantRow}>
        <View style={styles.errorBubble}>
          <Text style={styles.errorText}>{message.content || "Não foi possível responder."}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.assistantBubble}>
        {message.status === "pending" && !message.content ? (
          <View style={styles.pending}>
            <ActivityIndicator color="#ef7f19" />
            <Text style={styles.pendingText}>Ana está pensando…</Text>
          </View>
        ) : (
          <>
            {elements.map((element, index) => (
              <Fragment key={`${message.id}-${index}`}>{element}</Fragment>
            ))}
            {waiting ? <ActivityIndicator color="#ef7f19" style={styles.streamHint} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

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
  errorText: {
    color: "#d71929",
    fontSize: 15,
    lineHeight: 22,
  },
});
