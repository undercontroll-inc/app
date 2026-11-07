import { Stack } from "expo-router";
import { brandHeaderOptions } from "../../../components/ui/headerItems";
import { modalScreenOptions, nativeStackOptions, rootScreenOptions } from "../../../utils/navigation";

export default function ClientsLayout() {
  return (
    <Stack screenOptions={nativeStackOptions}>
      <Stack.Screen
        name="index"
        options={{
          ...rootScreenOptions,
          ...brandHeaderOptions(),
          title: "Clientes",
        }}
      />
      <Stack.Screen name="new" options={{ ...modalScreenOptions, title: "Novo cliente" }} />
      <Stack.Screen name="[id]/index" options={{ title: "Cliente" }} />
      <Stack.Screen name="[id]/edit" options={{ ...modalScreenOptions, title: "Editar cliente" }} />
    </Stack>
  );
}
