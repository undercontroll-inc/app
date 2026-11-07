import { Stack } from "expo-router";
import { brandHeaderOptions } from "../../../components/ui/headerItems";
import { nativeStackOptions, rootScreenOptions } from "../../../utils/navigation";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={nativeStackOptions}>
      <Stack.Screen
        name="index"
        options={{
          ...rootScreenOptions,
          ...brandHeaderOptions(),
          title: "Painel",
        }}
      />
    </Stack>
  );
}
