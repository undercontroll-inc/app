import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import SearchField from "../../../components/SearchField";
import ConversationRow from "../../../components/chat/ConversationRow";
import { openConversation } from "../../../components/chat/navigation";
import Banner from "../../../components/ui/Banner";
import Field from "../../../components/ui/Field";
import Sheet from "../../../components/ui/Sheet";
import StateView from "../../../components/ui/StateView";
import SwipeRow from "../../../components/ui/SwipeRow";
import Text from "../../../components/ui/Text";
import {
  useConversations,
  useDeleteConversation,
  usePrefetchConversation,
  useRenameConversation,
} from "../../../hooks/queries/useChatHistory";
import { getErrorMessage } from "../../../providers/api";
import { groupConversations } from "../../../utils/chat";
import { haptics } from "../../../utils/haptics";
import { colors, radius } from "../../../theme";

const TITLE_MAX = 120;

function matches(conversation, text) {
  if (!text) return true;
  return `${conversation.title} ${conversation.preview}`.toLowerCase().includes(text);
}

export default function ConversationHistoryScreen() {
  const [search, setSearch] = useState("");
  const [pulling, setPulling] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [actionError, setActionError] = useState("");
  const query = useConversations();
  const prefetch = usePrefetchConversation();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();
  const menu = useActionMenu();
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return groupConversations(query.conversations.filter((item) => matches(item, text)));
  }, [query.conversations, search]);

  const onRefresh = useCallback(async () => {
    setPulling(true);
    await refetch();
    setPulling(false);
  }, [refetch]);

  const submitRename = useCallback(
    (conversation, title) => {
      const clean = String(title ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, TITLE_MAX);
      if (!clean || clean === conversation.title) return;
      setActionError("");
      rename.mutate(
        { conversationId: conversation.conversationId, title: clean },
        { onError: (error) => setActionError(getErrorMessage(error)) },
      );
    },
    [rename],
  );

  const askRename = useCallback(
    (conversation) => {
      if (Platform.OS === "ios") {
        Alert.prompt(
          "Renomear conversa",
          undefined,
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Salvar", onPress: (value) => submitRename(conversation, value) },
          ],
          "plain-text",
          conversation.title,
        );
        return;
      }
      setRenaming({ conversation, title: conversation.title });
    },
    [submitRename],
  );

  const askDelete = useCallback(
    (conversation) => {
      Alert.alert("Excluir conversa?", `“${conversation.title}” será removida do histórico.`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            haptics.success();
            setActionError("");
            remove.mutate(conversation.conversationId, {
              onError: (error) => setActionError(getErrorMessage(error)),
            });
          },
        },
      ]);
    },
    [remove],
  );

  const { show } = menu;
  const openMenu = useCallback(
    (conversation) => {
      show({
        title: conversation.title,
        options: [
          { label: "Renomear", onPress: () => askRename(conversation) },
          { label: "Excluir", destructive: true, onPress: () => askDelete(conversation) },
          { label: "Cancelar", cancel: true },
        ],
      });
    },
    [askDelete, askRename, show],
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === "header") {
        return (
          <Text style={styles.section} tone="muted" variant="footnote" weight="600">
            {item.title.toUpperCase()}
          </Text>
        );
      }
      const next = rows[index + 1];
      const previous = rows[index - 1];
      const first = !previous || previous.type === "header";
      const last = !next || next.type === "header";
      return (
        <SwipeRow
          actions={[
            { label: "Renomear", icon: "edit", color: colors.orange, onPress: () => askRename(item.conversation) },
            { label: "Excluir", icon: "trash", color: colors.danger, onPress: () => askDelete(item.conversation) },
          ]}
          clipStyle={[styles.square, first && styles.first, last && styles.last]}
          flat
        >
          <View style={[styles.rowSurface, first && styles.first, last && styles.last]}>
            <ConversationRow
              conversation={item.conversation}
              last={last}
              onLongPress={Platform.OS === "ios" ? undefined : openMenu}
              onPress={openConversation}
              onPressIn={(conversation) => prefetch(conversation.conversationId)}
            />
          </View>
        </SwipeRow>
      );
    },
    [askDelete, askRename, openMenu, prefetch, rows],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const empty = (
    <StateView
      error={query.isError ? getErrorMessage(query.error) : null}
      icon="sparkles"
      loading={query.isPending}
      loadingText="Carregando conversas..."
      message={search ? "Tente outra palavra." : "Suas conversas com a Ana aparecem aqui."}
      onRetry={refetch}
      title={search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
    />
  );

  return (
    <View style={styles.screen}>
      <FlashList
        ListEmptyComponent={empty}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={styles.footer} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField onChangeText={setSearch} placeholder="Buscar conversa" value={search} />
            {actionError ? <Banner message={actionError} tone="danger" /> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={pulling} tintColor={colors.orange} />}
        renderItem={renderItem}
      />
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
      <Sheet
        confirmDisabled={!renaming?.title?.trim()}
        confirmLabel="Salvar"
        onClose={() => setRenaming(null)}
        onConfirm={() => {
          submitRename(renaming.conversation, renaming.title);
          setRenaming(null);
        }}
        title="Renomear conversa"
        visible={Boolean(renaming)}
      >
        <View style={styles.sheetBody}>
          <Field
            autoFocus
            maxLength={TITLE_MAX}
            onChangeText={(title) => setRenaming((current) => ({ ...current, title }))}
            value={renaming?.title ?? ""}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 48, paddingHorizontal: 20, paddingTop: 8 },
  header: { gap: 12, marginBottom: 4 },
  section: { letterSpacing: 0.3, marginBottom: 8, marginTop: 20, paddingHorizontal: 4 },
  square: { borderRadius: 0 },
  rowSurface: { backgroundColor: colors.surface, overflow: "hidden" },
  first: { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  last: { borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  footer: { marginVertical: 16 },
  sheetBody: { padding: 20 },
});
