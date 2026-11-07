import { memo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import SearchField from "./SearchField";
import { ListRow } from "./ui/ListSection";
import Sheet from "./ui/Sheet";
import Text from "./ui/Text";
import { colors, radius } from "../theme";

const SearchResultRow = memo(function SearchResultRow({ item, onSelect, last }) {
  return <ListRow last={last} onPress={() => onSelect(item)} subtitle={item.meta} title={item.title} />;
});

export default function SearchSheet({
  visible,
  title,
  placeholder,
  query,
  onChangeQuery,
  results = [],
  emptyText = "Nenhum resultado.",
  onSelect,
  onClose,
}) {
  return (
    <Sheet fullHeight onClose={onClose} title={title} visible={visible}>
      <View style={styles.searchWrap}>
        <SearchField autoFocus onChangeText={onChangeQuery} placeholder={placeholder} value={query} />
      </View>
      <FlatList
        ListEmptyComponent={
          <Text align="center" style={styles.empty} tone="muted" variant="callout">
            {emptyText}
          </Text>
        }
        contentContainerStyle={styles.listContent}
        data={results}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <View style={[styles.rowWrap, index === 0 && styles.first, index === results.length - 1 && styles.last]}>
            <SearchResultRow item={item} last={index === results.length - 1} onSelect={onSelect} />
          </View>
        )}
        style={styles.list}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingBottom: 12, paddingHorizontal: 16 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32, paddingHorizontal: 16 },
  rowWrap: { backgroundColor: colors.surface, overflow: "hidden" },
  first: { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  last: { borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  empty: { paddingVertical: 32 },
});
