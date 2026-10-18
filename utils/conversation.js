import AsyncStorage from "@react-native-async-storage/async-storage";
import { createConversationId, isValidConversationId } from "./chat";

const CONVERSATION_KEY = "anaConversationId";

export async function loadConversationId() {
  const stored = await AsyncStorage.getItem(CONVERSATION_KEY).catch(() => null);
  return isValidConversationId(stored) ? stored : startConversation();
}

export async function startConversation() {
  const id = createConversationId();
  await AsyncStorage.setItem(CONVERSATION_KEY, id).catch(() => {});
  return id;
}

export async function clearConversation() {
  await AsyncStorage.removeItem(CONVERSATION_KEY).catch(() => {});
}
