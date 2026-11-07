import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import Icon from "../../../../../components/Icon";
import Banner from "../../../../../components/stock-import/Banner";
import Button from "../../../../../components/stock-import/Button";
import { headerButtonOptions } from "../../../../../components/ui/headerItems";
import ImportItemRow from "../../../../../components/stock-import/ImportItemRow";
import Section from "../../../../../components/stock-import/Section";
import StepIndicator from "../../../../../components/stock-import/StepIndicator";
import StickyFooter from "../../../../../components/stock-import/StickyFooter";
import { colors } from "../../../../../components/stock-import/theme";
import { useStockImportDraft } from "../../../../../contexts/StockImportDraftContext";
import { useSaveStockImportDraft, useStockImport } from "../../../../../hooks/queries/useStockImports";
import useCancelImportPrompt from "../../../../../hooks/useCancelImportPrompt";
import { getErrorMessage } from "../../../../../providers/api";
import { haptics } from "../../../../../utils/haptics";
import {
  buildConfirmPayload,
  canConfirm,
  formatBRL,
  formatIssueDate,
  groupItems,
  IMPORT_STATUS,
  summarize,
} from "../../../../../utils/stockImport";

const AUTOSAVE_DELAY_MS = 1200;

function useDraftAutosave(importId, draft, reconcile) {
  const { mutate: save } = useSaveStockImportDraft(importId);
  const payloadKey = draft ? JSON.stringify(buildConfirmPayload(draft)) : null;
  const lastSaved = useRef(null);

  useEffect(() => {
    if (!payloadKey) return undefined;
    if (lastSaved.current === null) {
      lastSaved.current = payloadKey;
      return undefined;
    }
    if (payloadKey === lastSaved.current) return undefined;
    const timer = setTimeout(() => {
      lastSaved.current = payloadKey;
      save(JSON.parse(payloadKey), { onSuccess: reconcile });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [payloadKey, reconcile, save]);
}

function ItemsSection({ title, tone, items, onOpen, onToggleIgnore, footer }) {
  if (!items.length) return null;
  return (
    <Section footer={footer} title={`${title} · ${items.length}`} tone={tone}>
      {items.map((item, index) => (
        <ImportItemRow
          isLast={index === items.length - 1}
          item={item}
          key={item.key}
          onPress={onOpen}
          onToggleIgnore={onToggleIgnore}
        />
      ))}
    </Section>
  );
}

export default function ImportReviewScreen() {
  const { importId } = useLocalSearchParams();
  const query = useStockImport(importId);
  const { draft, seed, toggleIgnore, addItem, reconcile } = useStockImportDraft(importId);
  const promptCancel = useCancelImportPrompt(importId);
  const dto = query.data;

  useEffect(() => {
    if (dto?.status === IMPORT_STATUS.READY) seed(dto);
  }, [dto, seed]);

  useDraftAutosave(importId, draft, reconcile);

  const groups = useMemo(() => (draft ? groupItems(draft.items) : null), [draft]);
  const summary = useMemo(() => (draft ? summarize(draft.items) : null), [draft]);
  const ready = canConfirm(draft);

  const openItem = useCallback(
    (item) => {
      haptics.selection();
      router.push(`/stock/import/${importId}/item/${encodeURIComponent(item.key)}`);
    },
    [importId],
  );

  const onToggleIgnore = useCallback((item) => toggleIgnore(item.key), [toggleIgnore]);

  function addManual() {
    const item = addItem();
    router.push(`/stock/import/${importId}/item/${encodeURIComponent(item.key)}`);
  }

  const header = <Stack.Screen options={headerButtonOptions({ label: "Cancelar", onPress: promptCancel })} />;

  if (!draft) {
    return (
      <View style={styles.center}>
        {header}
        {dto && dto.status !== IMPORT_STATUS.READY ? (
          <>
            <Text style={styles.error}>Esta nota não está mais disponível para revisão.</Text>
            <Button label="Fechar" onPress={promptCancel} variant="secondary" />
          </>
        ) : query.isError ? (
          <>
            <Text style={styles.error}>{getErrorMessage(query.error)}</Text>
            <Button label="Tentar novamente" onPress={() => query.refetch()} variant="secondary" />
          </>
        ) : (
          <ActivityIndicator color={colors.orange} />
        )}
      </View>
    );
  }

  const issuedAt = formatIssueDate(draft.invoice.issuedAt);
  const invoiceTotal = draft.invoice.total;
  const totalMismatch =
    draft.warnings.includes("ITEMS_TOTAL_MISMATCH") && invoiceTotal != null
      ? `A nota soma ${formatBRL(invoiceTotal)}, mas os itens lidos somam ${formatBRL(dto?.itemsTotal ?? summary.total)}. Confira se algum item ficou de fora.`
      : null;
  const pendingCount = groups.attention.length;

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <StepIndicator step={2} />

        <View style={styles.summary}>
          <Text style={styles.summaryTotal}>{formatBRL(summary.total)}</Text>
          <Text style={styles.summaryMeta}>
            {[`${summary.count} ${summary.count === 1 ? "produto" : "produtos"}`, draft.supplier.name, issuedAt]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        {draft.warnings.includes("POSSIBLE_DUPLICATE") ? (
          <Banner
            actionLabel={draft.duplicateOfImportId ? "Ver importação anterior" : undefined}
            message="Parece que esta nota já entrou no estoque antes. Confirme só se tiver certeza."
            onAction={() => router.push(`/stock/import/${draft.duplicateOfImportId}/done`)}
            title="Possível nota duplicada"
            tone="warning"
          />
        ) : null}
        {totalMismatch ? <Banner message={totalMismatch} title="Total diferente da nota" tone="warning" /> : null}

        <ItemsSection
          footer="Toque para revisar. Deslize para a esquerda para ignorar."
          items={groups.attention}
          onOpen={openItem}
          onToggleIgnore={onToggleIgnore}
          title="Precisa de atenção"
          tone="warning"
        />
        <ItemsSection items={groups.ready} onOpen={openItem} onToggleIgnore={onToggleIgnore} title="Prontos" />
        <ItemsSection items={groups.ignored} onOpen={openItem} onToggleIgnore={onToggleIgnore} title="Ignorados" />

        <Pressable onPress={addManual} style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
          <Icon color={colors.orange} feather="plus-circle" sf="plus.circle.fill" size={20} />
          <Text style={styles.addText}>Adicionar item manualmente</Text>
        </Pressable>
      </ScrollView>
      <StickyFooter
        note={
          pendingCount
            ? `Revise ${pendingCount} ${pendingCount === 1 ? "item" : "itens"} para continuar`
            : summary.count === 0
              ? "Inclua pelo menos um item"
              : null
        }
        noteTone="warning"
      >
        <Button
          disabled={!ready}
          label="Continuar"
          onPress={() => router.push(`/stock/import/${importId}/confirm`)}
          testID="review-continue"
        />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  center: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  content: { gap: 22, padding: 20, paddingBottom: 32 },
  summary: { gap: 4 },
  summaryTotal: { color: colors.navy, fontSize: 34, fontVariant: ["tabular-nums"], fontWeight: "800" },
  summaryMeta: { color: colors.muted, fontSize: 15 },
  addRow: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center", paddingVertical: 8 },
  addText: { color: colors.orange, fontSize: 16, fontWeight: "600" },
  error: { color: colors.danger, fontSize: 15, textAlign: "center" },
  pressed: { opacity: 0.6 },
});
