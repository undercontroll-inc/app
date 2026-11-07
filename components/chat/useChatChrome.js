import { useCallback, useEffect } from "react";
import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useActionMenu } from "../ActionMenu";
import { useTabBarVisibility } from "../../contexts/TabBarVisibilityContext";
import { haptics } from "../../utils/haptics";

export function useHideTabBarWithKeyboard() {
  const { setHidden } = useTabBarVisibility();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);

  useEffect(() => {
    setHidden(keyboardVisible);
  }, [keyboardVisible, setHidden]);

  useFocusEffect(useCallback(() => () => setHidden(false), [setHidden]));

  return keyboardVisible;
}

export function useMessageActions(onUseText) {
  const menu = useActionMenu();
  const { show } = menu;
  const open = useCallback(
    (message) => {
      haptics.medium();
      show({
        title: message.role === "user" ? "Sua mensagem" : "Resposta da Ana",
        options: [
          {
            label: "Copiar",
            onPress: async () => {
              await Clipboard.setStringAsync(message.content);
              haptics.success();
            },
          },
          { label: "Compartilhar", onPress: () => Share.share({ message: message.content }).catch(() => {}) },
          ...(message.role === "user" && onUseText
            ? [{ label: "Usar no campo de texto", onPress: () => onUseText(message.content) }]
            : []),
          { label: "Cancelar", cancel: true },
        ],
      });
    },
    [onUseText, show],
  );
  return { open, menu };
}
