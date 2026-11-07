import { useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useCancelStockImport } from "./queries/useStockImports";

export function closeImportFlow() {
  router.dismissTo("/stock");
}

export default function useCancelImportPrompt(importId, { allowSaveForLater = true } = {}) {
  const { mutate: cancel } = useCancelStockImport();

  return useCallback(() => {
    const buttons = [{ text: "Continuar", style: "cancel" }];
    if (allowSaveForLater) buttons.push({ text: "Revisar depois", onPress: closeImportFlow });
    buttons.push({
      text: "Descartar nota",
      style: "destructive",
      onPress: () => {
        if (importId != null) cancel(importId);
        closeImportFlow();
      },
    });
    Alert.alert(
      "Sair da importação?",
      allowSaveForLater
        ? "Você pode voltar depois para terminar a revisão ou descartar esta nota."
        : "A análise desta nota será descartada.",
      buttons,
    );
  }, [allowSaveForLater, cancel, importId]);
}
