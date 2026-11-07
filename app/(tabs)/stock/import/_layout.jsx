import { Stack } from "expo-router";
import { StockImportDraftProvider } from "../../../../contexts/StockImportDraftContext";
import { colors } from "../../../../theme";
import { nativeStackOptions } from "../../../../utils/navigation";

export default function StockImportLayout() {
  return (
    <StockImportDraftProvider>
      <Stack screenOptions={nativeStackOptions}>
        <Stack.Screen name="index" options={{ headerLargeTitle: true, title: "Importar nota" }} />
        <Stack.Screen
          name="[importId]/analyzing"
          options={{ gestureEnabled: false, headerBackVisible: false, title: "Analisando" }}
        />
        <Stack.Screen
          name="[importId]/review"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerLargeTitle: true,
            title: "Revisar itens",
          }}
        />
        <Stack.Screen
          name="[importId]/item/[itemKey]"
          options={{
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
            presentation: "formSheet",
            sheetAllowedDetents: [0.8, 1],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen name="[importId]/confirm" options={{ title: "Confirmar entrada" }} />
        <Stack.Screen name="[importId]/done" options={{ gestureEnabled: false, headerShown: false }} />
      </Stack>
    </StockImportDraftProvider>
  );
}
