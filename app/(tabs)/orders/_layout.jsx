import { Stack } from "expo-router";
import { brandHeaderOptions } from "../../../components/ui/headerItems";
import { modalScreenOptions, nativeStackOptions, rootScreenOptions } from "../../../utils/navigation";

export default function OrdersLayout() {
  return (
    <Stack screenOptions={nativeStackOptions}>
      <Stack.Screen
        name="index"
        options={{
          ...rootScreenOptions,
          ...brandHeaderOptions(),
          title: "Consertos",
        }}
      />
      <Stack.Screen name="new" options={{ ...modalScreenOptions, title: "Nova ordem" }} />
      <Stack.Screen name="[id]" options={{ ...modalScreenOptions, title: "Editar ordem" }} />
      <Stack.Screen
        name="voice-note"
        options={{
          contentStyle: { backgroundColor: "#ffffff" },
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetCornerRadius: 28,
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
