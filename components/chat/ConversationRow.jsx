import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { ListRow } from "../ui/ListSection";
import { formatConversationTime } from "../../utils/chat";
import { colors } from "../../theme";

function ConversationRow({ conversation, onPress, onPressIn, onLongPress, last }) {
  return (
    <ListRow
      chevron={false}
      last={last}
      leading={
        <View style={styles.icon}>
          <Icon color={colors.orange} name="sparkles" size={16} />
        </View>
      }
      onLongPress={onLongPress ? () => onLongPress(conversation) : undefined}
      onPress={onPress ? () => onPress(conversation) : undefined}
      onPressIn={onPressIn ? () => onPressIn(conversation) : undefined}
      subtitle={conversation.preview || "Sem mensagens"}
      subtitleLines={1}
      testID={`conversation-${conversation.conversationId}`}
      title={conversation.title}
      titleLines={1}
      trailing={
        <Text style={styles.time} tone="muted" variant="footnote">
          {formatConversationTime(conversation.lastMessageAt ?? conversation.createdAt)}
        </Text>
      }
    />
  );
}

export default memo(ConversationRow);

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  time: { alignSelf: "flex-start", marginTop: 2 },
});
