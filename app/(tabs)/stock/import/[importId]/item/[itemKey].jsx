import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Icon from "../../../../../../components/Icon";
import Banner from "../../../../../../components/stock-import/Banner";
import HeaderTextButton from "../../../../../../components/stock-import/HeaderTextButton";
import Section, { Row } from "../../../../../../components/stock-import/Section";
import { colors } from "../../../../../../components/stock-import/theme";
import { useStockImportDraft } from "../../../../../../contexts/StockImportDraftContext";
import { useComponents } from "../../../../../../hooks/queries/useComponents";
import { haptics } from "../../../../../../utils/haptics";
import { parseDecimalBR } from "../../../../../../utils/stock";
import {
  formatBRL,
  formatQuantity,
  ITEM_ACTION,
  itemProblems,
  itemWarningLabel,
  lineTotal,
  priceInputValue,
} from "../../../../../../utils/stockImport";

const ACTIONS = [ITEM_ACTION.ADD, ITEM_ACTION.CREATE, ITEM_ACTION.IGNORE];
const ACTION_LABELS = ["Somar ao estoque", "Criar novo", "Ignorar"];

function itemToForm(item) {
  return {
    description: item.description ?? "",
    quantity: item.quantity == null ? "" : formatQuantity(item.quantity),
    unit: item.unit ?? "",
    unitPrice: priceInputValue(item.unitPrice),
    action: item.action,
    componentId: item.componentId,
    componentName: item.componentName,
    componentQuantity: item.componentQuantity,
    updatePrice: Boolean(item.updatePrice),
    newName: item.newComponent?.name ?? "",
    newBrand: item.newComponent?.brand ?? "",
    newCategory: item.newComponent?.category ?? "",
  };
}

function formToPatch(form) {
  const quantityText = form.quantity.trim();
  const priceText = form.unitPrice.trim();
  const newComponent =
    form.action === ITEM_ACTION.CREATE && (form.newName.trim() || form.newBrand.trim() || form.newCategory.trim())
      ? {
          name: form.newName.trim() || form.description.trim(),
          brand: form.newBrand.trim() || null,
          category: form.newCategory.trim() || null,
          description: null,
        }
      : null;
  return {
    description: form.description,
    quantity: quantityText ? parseDecimalBR(quantityText) : null,
    unit: form.unit.trim() ? form.unit.trim().toUpperCase() : null,
    unitPrice: priceText ? parseDecimalBR(priceText) : null,
    action: form.action,
    componentId: form.componentId,
    componentName: form.componentName,
    componentQuantity: form.componentQuantity,
    updatePrice: form.action === ITEM_ACTION.ADD && form.updatePrice,
    newComponent,
  };
}

function InputRow({ label, last, style, ...props }) {
  return (
    <View style={[styles.inputRow, !last && styles.separator]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.subtle} style={[styles.input, style]} {...props} />
    </View>
  );
}

function OptionRow({ title, subtitle, selected, onPress, last }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, !last && styles.separator, pressed && styles.pressed]}
    >
      <View style={styles.optionBody}>
        <Text numberOfLines={2} style={styles.optionTitle}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      {selected ? <Icon color={colors.orange} feather="check" sf="checkmark" size={18} /> : null}
    </Pressable>
  );
}

function candidateSubtitle(candidate) {
  return [
    candidate.brand,
    `${candidate.currentQuantity ?? 0} em estoque`,
    candidate.score != null ? `${Math.round(candidate.score * 100)}% parecido` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function StockPicker({ item, form, onSelect }) {
  const [search, setSearch] = useState("");
  const componentsQuery = useComponents();

  const candidates = item.candidates ?? [];
  const results = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return [];
    return (componentsQuery.data ?? [])
      .filter((c) => `${c.item ?? ""} ${c.brand ?? ""}`.toLowerCase().includes(text))
      .slice(0, 6)
      .map((c) => ({ componentId: c.id, name: c.item, brand: c.brand, currentQuantity: c.quantity, score: null }));
  }, [componentsQuery.data, search]);

  const selectedOutsideCandidates =
    form.componentId != null && !candidates.some((c) => c.componentId === form.componentId)
      ? [{ componentId: form.componentId, name: form.componentName, currentQuantity: form.componentQuantity }]
      : [];
  const options = [...selectedOutsideCandidates, ...candidates];

  return (
    <>
      <Section
        footer={options.length ? undefined : "Nenhuma sugestão automática. Busque o produto abaixo."}
        title="Produto no estoque"
      >
        {options.map((candidate, index) => (
          <OptionRow
            key={candidate.componentId}
            last={index === options.length - 1}
            onPress={() => onSelect(candidate)}
            selected={form.componentId === candidate.componentId}
            subtitle={candidateSubtitle(candidate)}
            title={candidate.name ?? `Produto #${candidate.componentId}`}
          />
        ))}
        {!options.length ? <View style={styles.emptyOptions} /> : null}
      </Section>
      <Section title="Buscar outro produto">
        <View style={styles.searchRow}>
          <Icon color={colors.subtle} feather="search" sf="magnifyingglass" size={16} />
          <TextInput
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setSearch}
            placeholder="Nome ou marca"
            placeholderTextColor={colors.subtle}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
        </View>
        {results.map((candidate, index) => (
          <OptionRow
            key={candidate.componentId}
            last={index === results.length - 1}
            onPress={() => {
              onSelect(candidate);
              setSearch("");
            }}
            selected={form.componentId === candidate.componentId}
            subtitle={candidateSubtitle(candidate)}
            title={candidate.name}
          />
        ))}
      </Section>
    </>
  );
}

export default function ImportItemSheet() {
  const { importId, itemKey } = useLocalSearchParams();
  const key = decodeURIComponent(String(itemKey));
  const { draft, updateItem, removeItem } = useStockImportDraft(importId);
  const item = draft?.items.find((candidate) => candidate.key === key);
  const [form, setForm] = useState(() => (item ? itemToForm(item) : null));

  if (!item || !form) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Este item não está mais disponível.</Text>
        <HeaderTextButton label="Fechar" onPress={() => router.back()} />
      </View>
    );
  }

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const patch = formToPatch(form);
  const preview = { ...item, ...patch };
  const problems = itemProblems(preview);
  const total = lineTotal(preview);
  const quantityNumber = patch.quantity;
  const fractional = quantityNumber != null && quantityNumber > 0 && !Number.isInteger(quantityNumber);
  const warnings = item.warnings.map(itemWarningLabel).filter(Boolean);
  const isManualEmpty = item.manual && !item.description;

  function close() {
    if (isManualEmpty) removeItem(item.key);
    router.back();
  }

  function save() {
    updateItem(item.key, { ...patch, reviewed: true, serverError: null });
    haptics.light();
    router.back();
  }

  function selectAction(index) {
    haptics.selection();
    set({ action: ACTIONS[index] });
  }

  function selectComponent(candidate) {
    haptics.selection();
    set({
      componentId: candidate.componentId,
      componentName: candidate.name,
      componentQuantity: candidate.currentQuantity ?? null,
    });
  }

  const actionIndex = ACTIONS.indexOf(form.action);
  const stockPreview =
    form.action === ITEM_ACTION.ADD && form.componentQuantity != null && quantityNumber
      ? `${form.componentQuantity} → ${form.componentQuantity + Math.round(quantityNumber)}`
      : null;

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      <View style={styles.navBar}>
        <HeaderTextButton label="Cancelar" onPress={close} />
        <Text style={styles.navTitle}>{item.manual ? "Novo item" : "Revisar item"}</Text>
        <HeaderTextButton disabled={problems.length > 0} filled label="Salvar" onPress={save} />
      </View>

      {item.serverError ? (
        <Banner message={item.serverError} title="O servidor recusou este item" tone="danger" />
      ) : null}
      {warnings.length && !item.reviewed ? (
        <Banner
          message={`Lido na nota: ${formatQuantity(item.quantity)} ${item.unit ?? ""} × ${formatBRL(item.unitPrice)}. Confira com o papel.`}
          title={warnings.join(" · ")}
          tone="warning"
        />
      ) : null}

      <Section title="Dados da nota">
        <View style={[styles.descriptionRow, styles.separator]}>
          <Text style={styles.inputLabel}>Descrição</Text>
          <TextInput
            multiline
            onChangeText={(description) => set({ description })}
            placeholder="Ex.: Resistência 220V"
            placeholderTextColor={colors.subtle}
            style={styles.descriptionInput}
            value={form.description}
          />
        </View>
        <InputRow
          keyboardType="decimal-pad"
          label="Quantidade"
          onChangeText={(quantity) => set({ quantity })}
          placeholder="0"
          selectTextOnFocus
          value={form.quantity}
        />
        <InputRow
          autoCapitalize="characters"
          label="Unidade"
          maxLength={6}
          onChangeText={(unit) => set({ unit })}
          placeholder="UN"
          value={form.unit}
        />
        <InputRow
          keyboardType="decimal-pad"
          label="Preço unitário"
          onChangeText={(unitPrice) => set({ unitPrice })}
          placeholder="0,00"
          selectTextOnFocus
          value={form.unitPrice}
        />
        <Row label="Total" last strong value={formatBRL(total)} />
      </Section>

      {fractional ? (
        <Pressable
          onPress={() => set({ quantity: String(Math.max(1, Math.round(quantityNumber))) })}
          style={styles.roundHint}
        >
          <Icon color={colors.orange} feather="refresh-cw" sf="arrow.triangle.2.circlepath" size={14} />
          <Text style={styles.roundText}>
            O estoque só aceita números inteiros. Arredondar para {Math.max(1, Math.round(quantityNumber))}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.segmentWrap}>
        <Text style={styles.segmentTitle}>O que fazer com este item</Text>
        <SegmentedControl
          fontStyle={{ color: colors.navy, fontSize: 13 }}
          activeFontStyle={{ color: colors.navy, fontSize: 13, fontWeight: "700" }}
          onChange={(event) => selectAction(event.nativeEvent.selectedSegmentIndex)}
          selectedIndex={actionIndex < 0 ? 0 : actionIndex}
          values={ACTION_LABELS}
        />
      </View>

      {form.action === ITEM_ACTION.ADD ? (
        <>
          <StockPicker form={form} item={item} onSelect={selectComponent} />
          {form.componentId != null ? (
            <Section footer={stockPreview ? `Quantidade em estoque: ${stockPreview}` : undefined}>
              <View style={styles.switchRow}>
                <View style={styles.switchBody}>
                  <Text style={styles.switchTitle}>Atualizar preço do produto</Text>
                  <Text style={styles.switchSubtitle}>Usar {formatBRL(patch.unitPrice)} como novo preço</Text>
                </View>
                <Switch
                  disabled={patch.unitPrice == null}
                  onValueChange={(updatePrice) => {
                    haptics.selection();
                    set({ updatePrice });
                  }}
                  trackColor={{ true: colors.orange }}
                  value={form.updatePrice}
                />
              </View>
            </Section>
          ) : null}
        </>
      ) : null}

      {form.action === ITEM_ACTION.CREATE ? (
        <Section
          footer="Se deixar em branco, usamos a descrição da nota e o fornecedor como padrão."
          title="Novo produto"
        >
          <InputRow
            label="Nome"
            onChangeText={(newName) => set({ newName })}
            placeholder={form.description || "Nome"}
            value={form.newName}
          />
          <InputRow
            label="Marca"
            onChangeText={(newBrand) => set({ newBrand })}
            placeholder="Opcional"
            value={form.newBrand}
          />
          <InputRow
            label="Categoria"
            last
            onChangeText={(newCategory) => set({ newCategory })}
            placeholder="Opcional"
            value={form.newCategory}
          />
        </Section>
      ) : null}

      {form.action === ITEM_ACTION.IGNORE ? (
        <Text style={styles.ignoreText}>
          Este item não vai entrar no estoque. Você pode incluí-lo de novo quando quiser.
        </Text>
      ) : null}

      {problems.length && form.action !== ITEM_ACTION.IGNORE ? <Text style={styles.problem}>{problems[0]}</Text> : null}

      {item.manual ? (
        <Pressable
          onPress={() => {
            haptics.medium();
            removeItem(item.key);
            router.back();
          }}
          style={styles.removeRow}
        >
          <Text style={styles.removeText}>Remover item</Text>
        </Pressable>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 20, paddingBottom: 48, paddingHorizontal: 16, paddingTop: 18 },
  navBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 4 },
  navTitle: { color: colors.navy, fontSize: 17, fontWeight: "700" },
  separator: { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { alignItems: "center", flexDirection: "row", gap: 12, marginLeft: 16, minHeight: 50, paddingRight: 16 },
  inputLabel: { color: colors.navy, fontSize: 15 },
  input: {
    color: colors.navy,
    flex: 1,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    paddingVertical: 12,
    textAlign: "right",
  },
  descriptionRow: { gap: 4, marginLeft: 16, paddingRight: 16, paddingVertical: 12 },
  descriptionInput: { color: colors.navy, fontSize: 16, fontWeight: "600", minHeight: 24, padding: 0 },
  roundHint: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: -8, paddingHorizontal: 4 },
  roundText: { color: colors.orange, flex: 1, fontSize: 13, fontWeight: "600" },
  segmentWrap: { gap: 10 },
  segmentTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginLeft: 16,
    minHeight: 56,
    paddingRight: 16,
    paddingVertical: 10,
  },
  optionBody: { flex: 1, gap: 2 },
  optionTitle: { color: colors.navy, fontSize: 15, fontWeight: "600" },
  optionSubtitle: { color: colors.muted, fontSize: 13 },
  emptyOptions: { height: 0 },
  searchRow: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  searchInput: { color: colors.navy, flex: 1, fontSize: 15, paddingVertical: 14 },
  switchRow: { alignItems: "center", flexDirection: "row", gap: 12, padding: 16 },
  switchBody: { flex: 1, gap: 2 },
  switchTitle: { color: colors.navy, fontSize: 15, fontWeight: "600" },
  switchSubtitle: { color: colors.muted, fontSize: 13 },
  ignoreText: { color: colors.muted, fontSize: 14, lineHeight: 20, paddingHorizontal: 4 },
  problem: { color: colors.warning, fontSize: 13, fontWeight: "600", paddingHorizontal: 4 },
  removeRow: { alignItems: "center", paddingVertical: 12 },
  removeText: { color: colors.danger, fontSize: 16, fontWeight: "600" },
  missing: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  missingText: { color: colors.muted, fontSize: 15 },
  pressed: { backgroundColor: colors.background },
});
