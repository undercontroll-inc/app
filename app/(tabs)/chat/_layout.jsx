import { Stack } from "expo-router";
import { nativeStackOptions } from "../../../utils/navigation";

export default function ChatLayout() {
  return (
    <Stack screenOptions={nativeStackOptions}>
      <Stack.Screen name="index" options={{ title: "Ana AI" }} />
      <Stack.Screen name="[conversationId]" options={{ title: "Conversa" }} />
      <Stack.Screen name="history" options={{ headerLargeTitle: true, title: "Conversas" }} />
    </Stack>
  );
}
