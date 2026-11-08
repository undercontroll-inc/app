import { Platform, StyleSheet } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef } from "react";
import ChatComposer from "./ChatComposer";
import useComposerDictation from "../../hooks/useComposerDictation";
import Text from "../ui/Text";
import { colors } from "../../theme";

export default function ChatComposerDock({
  value,
  onChangeText,
  onSend,
  disabled,
  busyNotice,
  keyboardVisible,
  onInputLayout,
}) {
  const insets = useSafeAreaInsets();
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const appendText = useCallback(
    (text) => {
      const current = valueRef.current.trim();
      onChangeText(current ? `${current} ${text}` : text);
    },
    [onChangeText],
  );
  const dictation = useComposerDictation({ onText: appendText });
  const notice = dictation.error || busyNotice;
  const dockPadding = Platform.OS === "ios" && !keyboardVisible ? insets.bottom : 0;
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }} style={[styles.dock, { paddingBottom: dockPadding }]}>
      {notice ? (
        <Text style={styles.notice} tone={dictation.error ? "danger" : "warning"} variant="subhead" weight="600">
          {notice}
        </Text>
      ) : null}
      <ChatComposer
        dictation={dictation}
        disabled={disabled}
        nativeID="chat-input"
        onMicPress={dictation.start}
        onChangeText={onChangeText}
        onInputLayout={onInputLayout}
        onSend={onSend}
        value={value}
      />
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  dock: { backgroundColor: colors.background },
  notice: { paddingHorizontal: 20, paddingTop: 8 },
});
