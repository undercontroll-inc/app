import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import Button from "../../../../../components/stock-import/Button";
import { headerButtonOptions } from "../../../../../components/ui/headerItems";
import ProcessingChecklist from "../../../../../components/stock-import/ProcessingChecklist";
import ScanPreview from "../../../../../components/stock-import/ScanPreview";
import StepIndicator from "../../../../../components/stock-import/StepIndicator";
import { colors, radius } from "../../../../../components/stock-import/theme";
import {
  useCancelStockImport,
  useRetryStockImport,
  useStockImport,
} from "../../../../../hooks/queries/useStockImports";
import useCancelImportPrompt from "../../../../../hooks/useCancelImportPrompt";
import { getErrorMessage } from "../../../../../providers/api";
import { haptics } from "../../../../../utils/haptics";
import { failureCopy, IMPORT_STATUS, stageIndex } from "../../../../../utils/stockImport";

const CHECKLIST = ["Arquivo recebido", "Lendo produtos e valores", "Associando ao estoque"];
const CLIENT_DEADLINE_MS = 100000;

function useChecklistProgress(running, startedAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(timer);
  }, [running]);
  const elapsed = now - startedAt;
  if (elapsed < 700) return 0;
  return elapsed < 5000 ? 1 : 2;
}

export default function ImportAnalyzingScreen() {
  const { importId, previewUri, fileName, isImage } = useLocalSearchParams();
  const query = useStockImport(importId);
  const retry = useRetryStockImport(importId);
  const { mutate: cancelImport } = useCancelStockImport();
  const promptCancel = useCancelImportPrompt(importId, { allowSaveForLater: false });
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const status = query.data?.status;
  const processing = !status || status === IMPORT_STATUS.PROCESSING;
  const ready = status === IMPORT_STATUS.READY;
  const failed = status === IMPORT_STATUS.FAILED || timedOut;
  const timedIndex = useChecklistProgress(processing && !timedOut, startedAt);
  const serverIndex = stageIndex(query.data?.stage);
  const activeIndex = serverIndex ?? timedIndex;

  useEffect(() => {
    if (!processing) return undefined;
    const remaining = CLIENT_DEADLINE_MS - (Date.now() - startedAt);
    const timer = setTimeout(() => setTimedOut(true), Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [processing, startedAt]);

  useEffect(() => {
    if (ready) {
      haptics.success();
      const timer = setTimeout(() => router.replace(`/stock/import/${importId}/review`), 650);
      return () => clearTimeout(timer);
    }
    if (status === IMPORT_STATUS.CONFIRMED) router.replace(`/stock/import/${importId}/done`);
    if (status === IMPORT_STATUS.FAILED) haptics.error();
    return undefined;
  }, [importId, ready, status]);

  function tryAgain() {
    setTimedOut(false);
    setStartedAt(Date.now());
    if (status === IMPORT_STATUS.FAILED) retry.mutate();
    else query.refetch();
  }

  function sendAnother() {
    cancelImport(importId);
    router.back();
  }

  const copy = timedOut ? failureCopy("TIMEOUT") : failureCopy(query.data?.failureReason);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          ...headerButtonOptions({ label: "Cancelar", onPress: promptCancel }),
          title: failed ? "Algo deu errado" : "Analisando",
        }}
      />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <StepIndicator step={1} />
        <View style={styles.preview}>
          <ScanPreview
            fileName={fileName}
            isImage={isImage === "1"}
            scanning={processing && !failed}
            uri={previewUri}
          />
        </View>

        {failed ? (
          <View style={styles.message}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.message}</Text>
            {retry.isError ? <Text style={styles.error}>{getErrorMessage(retry.error)}</Text> : null}
            <View style={styles.actions}>
              <Button label="Tentar novamente" loading={retry.isPending} onPress={tryAgain} />
              <Button label="Enviar outro arquivo" onPress={sendAnother} variant="secondary" />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.message}>
              <Text style={styles.title}>{ready ? "Leitura concluída" : "Analisando sua nota…"}</Text>
              <Text style={styles.subtitle}>
                {ready
                  ? "Tudo certo! Abrindo os itens para você revisar."
                  : "A IA está lendo produtos, quantidades e valores. Costuma levar poucos segundos."}
              </Text>
            </View>
            <View style={styles.card}>
              <ProcessingChecklist activeIndex={activeIndex} done={ready} steps={CHECKLIST} />
            </View>
            {query.isError ? <Text style={styles.error}>{getErrorMessage(query.error)}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 24, padding: 20, paddingBottom: 40 },
  preview: { alignItems: "center", paddingTop: 8 },
  message: { alignItems: "center", gap: 8 },
  title: { color: colors.navy, fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18 },
  actions: { alignSelf: "stretch", gap: 10, marginTop: 12 },
  error: { color: colors.danger, fontSize: 13, textAlign: "center" },
});
