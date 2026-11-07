import { Stack } from "expo-router";
import { brandHeaderOptions } from "../../../components/ui/headerItems";
import { modalScreenOptions, nativeStackOptions, rootScreenOptions } from "../../../utils/navigation";

export default function StockLayout() {
  return (
    <Stack screenOptions={nativeStackOptions}>
      <Stack.Screen
        name="index"
        options={{
          ...rootScreenOptions,
          ...brandHeaderOptions(),
          title: "Estoque",
        }}
      />
      <Stack.Screen name="new" options={{ ...modalScreenOptions, title: "Novo item" }} />
      <Stack.Screen name="[id]" options={{ ...modalScreenOptions, title: "Editar item" }} />
      <Stack.Screen name="import" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}
