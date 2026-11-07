import { useEffect, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Banner from "../../../../../components/stock-import/Banner";
import Button from "../../../../../components/stock-import/Button";
import Section, { Row } from "../../../../../components/stock-import/Section";
import StepIndicator from "../../../../../components/stock-import/StepIndicator";
import StickyFooter from "../../../../../components/stock-import/StickyFooter";
import { colors } from "../../../../../components/stock-import/theme";
import { useStockImportDraft } from "../../../../../contexts/StockImportDraftContext";
import { useConfirmStockImport } from "../../../../../hooks/queries/useStockImports";
import { stockImportErrorMessage } from "../../../../../services/StockImportService";
import { haptics } from "../../../../../utils/haptics";
import {
  buildConfirmPayload,
  canConfirm,
  fieldPathToItemIndex,
  formatBRL,
  formatCnpj,
  formatIssueDate,
  formatQuantity,
  ITEM_ACTION,
  lineTotal,
  summarize,
} from "../../../../../utils/stockImport";

function EntryRow({ item, last }) {
  const quantity = formatQuantity(item.quantity);
  const isNew = item.action === ITEM_ACTION.CREATE;
  const name = isNew ? item.newComponent?.name || item.description : item.componentName || item.description;
  const detail = isNew
    ? `Novo produto · ${quantity} ${quantity === "1" ? "unidade" : "unidades"}`
    : item.componentQuantity != null
      ? `+${quantity} no estoque · ${item.componentQuantity} → ${item.componentQuantity + Number(item.quantity)}`
      : `+${quantity} no estoque`;

  return (
    <View style={[styles.entry, !last && styles.separator]}>
      <View style={styles.entryBody}>
        <Text numberOfLines={2} style={styles.entryName}>
          {name}
        </Text>
        <Text style={[styles.entryDetail, isNew ? styles.entryNew : styles.entryAdd]}>{detail}</Text>
      </View>
      <Text style={styles.entryTotal}>{formatBRL(lineTotal(item))}</Text>
    </View>
  );
}

export default function ImportConfirmScreen() {
  const { importId } = useLocalSearchParams();
  const { draft, setItemErrors } = useStockImportDraft(importId);
  const confirm = useConfirmStockImport(importId);

  const active = useMemo(
    () => (draft ? draft.items.filter((item) => item.action !== ITEM_ACTION.IGNORE) : []),
    [draft],
  );
  const summary = useMemo(() => (draft ? summarize(draft.items) : null), [draft]);

  useEffect(() => {
    if (!draft) router.back();
  }, [draft]);

  if (!draft) return null;

  function handleValidationError(error) {
    const byIndex = {};
    for (const fieldError of error.fieldErrors ?? []) {
      const index = fieldPathToItemIndex(fieldError.field);
      if (index != null && byIndex[index] == null) byIndex[index] = fieldError.message;
    }
    setItemErrors(byIndex);
    Alert.alert("Revise os itens marcados", "Alguns itens foram recusados pelo servidor.", [
      { text: "Revisar", onPress: () => router.back() },
    ]);
  }

  function submit() {
    haptics.medium();
    confirm.mutate(buildConfirmPayload(draft), {
      onSuccess: () => {
        haptics.success();
        router.replace(`/stock/import/${importId}/done`);
      },
      onError: (error) => {
        haptics.error();
        if (error.status === 409) {
          router.replace(`/stock/import/${importId}/done`);
          return;
        }
        if (error.code === "VALIDATION_ERROR" || error.fieldErrors?.length) handleValidationError(error);
      },
    });
  }

  const issuedAt = formatIssueDate(draft.invoice.issuedAt);
  const invoiceLabel = [draft.invoice.number, draft.invoice.series ? `série ${draft.invoice.series}` : null]
    .filter(Boolean)
    .join(" · ");
  const metadata = [
    ["Fornecedor", draft.supplier.name],
    ["CNPJ", formatCnpj(draft.supplier.cnpj)],
    ["Nota", invoiceLabel],
    ["Emissão", issuedAt],
  ].filter(([, value]) => value);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <StepIndicator step={3} />
        <View style={styles.heading}>
          <Text style={styles.title}>Tudo pronto</Text>
          <Text style={styles.subtitle}>O estoque só muda depois que você confirmar.</Text>
        </View>

        {metadata.length ? (
          <Section title="Nota fiscal">
            {metadata.map(([label, value], index) => (
              <Row key={label} label={label} last={index === metadata.length - 1} value={value} />
            ))}
          </Section>
        ) : null}

        <Section
          footer={
            summary.ignored
              ? `${summary.ignored} ${summary.ignored === 1 ? "item ignorado" : "itens ignorados"} não entram no estoque.`
              : undefined
          }
          title={`Entrada · ${active.length} ${active.length === 1 ? "produto" : "produtos"}`}
        >
          {active.map((item) => (
            <EntryRow item={item} key={item.key} last={false} />
          ))}
          <Row label="Total da entrada" last strong value={formatBRL(summary.total)} />
        </Section>

        <Banner
          icon={{ sf: "shippingbox.fill", feather: "package" }}
          message={`${summary.toUpdate} ${summary.toUpdate === 1 ? "produto será atualizado" : "produtos serão atualizados"}${
            summary.toCreate ? ` e ${summary.toCreate} ${summary.toCreate === 1 ? "será criado" : "serão criados"}` : ""
          }, somando ${summary.units} unidades.`}
          title="As quantidades entram na hora"
          tone="success"
        />

        {confirm.isError && confirm.error?.status !== 409 && !confirm.error?.fieldErrors?.length ? (
          <Banner message={stockImportErrorMessage(confirm.error)} title="Não foi possível confirmar" tone="danger" />
        ) : null}
      </ScrollView>
      <StickyFooter>
        <Button
          disabled={!canConfirm(draft)}
          label="Confirmar entrada"
          loading={confirm.isPending}
          onPress={submit}
          testID="confirm-submit"
        />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 22, padding: 20, paddingBottom: 32 },
  heading: { gap: 4 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 15 },
  separator: { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
  entry: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
  },
  entryBody: { flex: 1, gap: 4 },
  entryName: { color: colors.navy, fontSize: 15, fontWeight: "600" },
  entryDetail: { fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "600" },
  entryAdd: { color: colors.success },
  entryNew: { color: colors.info },
  entryTotal: { color: colors.navy, fontSize: 15, fontVariant: ["tabular-nums"], fontWeight: "600" },
});
