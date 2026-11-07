import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import Icon from "../../../../../components/Icon";
import Button from "../../../../../components/stock-import/Button";
import Section, { Row } from "../../../../../components/stock-import/Section";
import { colors } from "../../../../../components/stock-import/theme";
import { useStockImportDraft } from "../../../../../contexts/StockImportDraftContext";
import { useStockImport } from "../../../../../hooks/queries/useStockImports";
import { closeImportFlow } from "../../../../../hooks/useCancelImportPrompt";
import { haptics } from "../../../../../utils/haptics";
import { formatBRL, IMPORT_STATUS, summarizeResult } from "../../../../../utils/stockImport";

export default function ImportDoneScreen() {
  const { importId } = useLocalSearchParams();
  const query = useStockImport(importId);
  const { clear } = useStockImportDraft(importId);
  const confirmed = query.data?.status === IMPORT_STATUS.CONFIRMED;
  const result = useMemo(() => summarizeResult(query.data), [query.data]);

  useEffect(() => {
    if (!confirmed) return;
    haptics.success();
  }, [confirmed]);

  if (!confirmed) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  function importAnother() {
    clear();
    router.dismissTo("/stock/import");
  }

  const productCount = result.updated + result.created;
  const rows = [
    ["Produtos atualizados", String(result.updated)],
    result.created ? ["Produtos novos", String(result.created)] : null,
    ["Unidades adicionadas", String(result.units)],
    ["Valor da entrada", formatBRL(query.data.invoice?.total ?? result.total)],
  ].filter(Boolean);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badgeOuter}>
          <View style={styles.badgeInner}>
            <Icon color="#ffffff" feather="check" sf="checkmark" size={40} weight="bold" />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(360)} style={styles.message}>
          <Text style={styles.title}>Estoque atualizado!</Text>
          <Text style={styles.subtitle}>
            A nota foi importada e {productCount === 1 ? "1 produto recebeu" : `${productCount} produtos receberam`} as
            novas quantidades.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(280).duration(360)} style={styles.summary}>
          <Section>
            {rows.map(([label, value], index) => (
              <Row key={label} label={label} last={index === rows.length - 1} value={value} />
            ))}
          </Section>
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <Button label="Ver estoque" onPress={closeImportFlow} />
        <Button label="Importar outra nota" onPress={importAnother} variant="secondary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" },
  content: { alignItems: "center", flex: 1, gap: 24, justifyContent: "center", paddingHorizontal: 24 },
  badgeOuter: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    width: 112,
  },
  badgeInner: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  message: { alignItems: "center", gap: 8 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  summary: { alignSelf: "stretch" },
  actions: { gap: 10, paddingBottom: 8, paddingHorizontal: 24 },
});
