import { Pressable, StyleSheet, View } from "react-native";
import ConversationRow from "./ConversationRow";
import ListSection from "../ui/ListSection";
import Text from "../ui/Text";
import { useConversations, usePrefetchConversation } from "../../hooks/queries/useChatHistory";

const RECENT_COUNT = 3;

export default function RecentConversations({ onOpen, onSeeAll }) {
  const { conversations } = useConversations();
  const prefetch = usePrefetchConversation();
  const recent = conversations.slice(0, RECENT_COUNT);
  if (!recent.length) return null;

  return (
    <View style={styles.root}>
      <ListSection
        action={
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onSeeAll}
            style={styles.seeAll}
            testID="recent-see-all"
          >
            <Text tone="accent" variant="subhead" weight="600">
              Ver todas ›
            </Text>
          </Pressable>
        }
        title="Recentes"
      >
        {recent.map((conversation, index) => (
          <ConversationRow
            conversation={conversation}
            key={conversation.conversationId}
            last={index === recent.length - 1}
            onPress={onOpen}
            onPressIn={(item) => prefetch(item.conversationId)}
          />
        ))}
      </ListSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 24, paddingHorizontal: 20 },
  seeAll: { minHeight: 32, justifyContent: "center" },
});
