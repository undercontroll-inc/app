import { useCallback, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import Field from "../ui/Field";
import Sheet from "../ui/Sheet";
import { useRenameConversation } from "../../hooks/queries/useChatHistory";
import { getErrorMessage } from "../../providers/api";
import { haptics } from "../../utils/haptics";

const TITLE_MAX = 120;

export function cleanTitle(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TITLE_MAX);
}

export default function useRenameConversationPrompt({ onError } = {}) {
  const rename = useRenameConversation();
  const [editing, setEditing] = useState(null);

  const submit = useCallback(
    (conversation, value) => {
      const title = cleanTitle(value);
      if (!title || title === conversation.title) return;
      rename.mutate(
        { conversationId: conversation.conversationId, title },
        {
          onSuccess: () => haptics.success(),
          onError: (error) => {
            haptics.error();
            onError?.(getErrorMessage(error));
          },
        },
      );
    },
    [onError, rename],
  );

  const ask = useCallback(
    (conversation) => {
      if (Platform.OS === "ios") {
        Alert.prompt(
          "Renomear conversa",
          "Escolha um nome fácil de encontrar depois.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Salvar", onPress: (value) => submit(conversation, value) },
          ],
          "plain-text",
          conversation.title,
        );
        return;
      }
      setEditing({ conversation, title: conversation.title });
    },
    [submit],
  );

  const sheet = (
    <Sheet
      confirmDisabled={!cleanTitle(editing?.title)}
      confirmLabel="Salvar"
      onClose={() => setEditing(null)}
      onConfirm={() => {
        submit(editing.conversation, editing.title);
        setEditing(null);
      }}
      title="Renomear conversa"
      visible={Boolean(editing)}
    >
      <View style={styles.body}>
        <Field
          autoFocus
          maxLength={TITLE_MAX}
          onChangeText={(title) => setEditing((current) => ({ ...current, title }))}
          value={editing?.title ?? ""}
        />
      </View>
    </Sheet>
  );

  return { ask, sheet };
}

const styles = StyleSheet.create({
  body: { padding: 20 },
});
