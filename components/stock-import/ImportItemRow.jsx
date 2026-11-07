import { memo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Icon from "../Icon";
import { haptics } from "../../utils/haptics";
import {
  attentionReason,
  formatBRL,
  formatQuantity,
  formatUnit,
  ITEM_ACTION,
  itemNeedsAttention,
  lineTotal,
} from "../../utils/stockImport";
import { colors } from "./theme";

function chipFor(item) {
  if (item.action === ITEM_ACTION.IGNORE) return { label: "Ignorado", bg: colors.background, fg: colors.muted };
  if (item.action === ITEM_ACTION.CREATE) return { label: "Novo produto", bg: colors.infoSoft, fg: colors.info };
  if (item.componentId == null) return { label: "Escolher produto", bg: colors.warningSoft, fg: colors.warning };
  if (item.matchType === "ALIAS")
    return { label: `Reconhecido · ${item.componentName ?? "estoque"}`, bg: colors.successSoft, fg: colors.success };
  return {
    label: `+${formatQuantity(item.quantity)} em ${item.componentName ?? "estoque"}`,
    bg: colors.successSoft,
    fg: colors.success,
  };
}

function SwipeAction({ ignored, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.swipeAction, ignored ? styles.swipeRestore : styles.swipeIgnore]}>
      <Icon
        color="#ffffff"
        feather={ignored ? "rotate-ccw" : "eye-off"}
        sf={ignored ? "arrow.uturn.backward" : "eye.slash.fill"}
        size={20}
      />
      <Text style={styles.swipeText}>{ignored ? "Incluir" : "Ignorar"}</Text>
    </Pressable>
  );
}

function ImportItemRow({ item, onPress, onToggleIgnore, isLast }) {
  const swipeRef = useRef(null);
  const ignored = item.action === ITEM_ACTION.IGNORE;
  const attention = itemNeedsAttention(item);
  const chip = chipFor(item);
  const total = lineTotal(item);
  const reason = item.serverError || (attention ? attentionReason(item) : null);

  function toggle() {
    haptics.medium();
    swipeRef.current?.close();
    onToggleIgnore(item);
  }

  return (
    <ReanimatedSwipeable
      friction={1.6}
      overshootRight={false}
      ref={swipeRef}
      renderRightActions={() => <SwipeAction ignored={ignored} onPress={toggle} />}
      rightThreshold={48}
    >
      <Pressable
        accessibilityHint="Abre os detalhes do item"
        accessibilityRole="button"
        delayLongPress={350}
        onLongPress={toggle}
        onPress={() => onPress(item)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        testID={`import-item-${item.key}`}
      >
        {attention ? <View style={styles.attentionDot} /> : null}
        <View style={[styles.body, !isLast && styles.separator]}>
          <View style={styles.topLine}>
            <Text numberOfLines={2} style={[styles.title, ignored && styles.ignoredText]}>
              {item.description || "Item sem descrição"}
            </Text>
            <Text style={[styles.total, ignored && styles.ignoredText]}>{formatBRL(total)}</Text>
          </View>
          <Text style={styles.meta}>
            {formatQuantity(item.quantity)} {formatUnit(item.unit)} × {formatBRL(item.unitPrice)}
          </Text>
          {reason ? (
            <View style={styles.reason}>
              <Icon color={colors.warning} feather="alert-circle" sf="exclamationmark.circle.fill" size={14} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}
          <View style={styles.bottomLine}>
            <View style={[styles.chip, { backgroundColor: chip.bg }]}>
              <Text numberOfLines={1} style={[styles.chipText, { color: chip.fg }]}>
                {chip.label}
              </Text>
            </View>
            <Icon color={colors.subtle} feather="chevron-right" sf="chevron.right" size={14} />
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default memo(ImportItemRow);

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, flexDirection: "row", paddingLeft: 16 },
  pressed: { backgroundColor: colors.background },
  attentionDot: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    height: 8,
    left: 5,
    position: "absolute",
    top: 22,
    width: 8,
  },
  body: { flex: 1, gap: 6, paddingRight: 16, paddingVertical: 14 },
  separator: { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
  topLine: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  title: { color: colors.navy, flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  total: { color: colors.navy, fontSize: 15, fontVariant: ["tabular-nums"], fontWeight: "700" },
  ignoredText: { color: colors.subtle, textDecorationLine: "line-through" },
  meta: { color: colors.muted, fontSize: 13, fontVariant: ["tabular-nums"] },
  reason: { alignItems: "center", flexDirection: "row", gap: 6 },
  reasonText: { color: colors.warning, flex: 1, fontSize: 13, fontWeight: "600" },
  bottomLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  chip: { borderRadius: 999, flexShrink: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: "700" },
  swipeAction: { alignItems: "center", gap: 4, justifyContent: "center", width: 92 },
  swipeIgnore: { backgroundColor: colors.muted },
  swipeRestore: { backgroundColor: colors.success },
  swipeText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
});
