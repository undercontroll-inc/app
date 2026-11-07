import { Platform, StyleSheet } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatComposer from "./ChatComposer";
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
  const dockPadding = Platform.OS === "ios" && !keyboardVisible ? insets.bottom : 0;
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }} style={[styles.dock, { paddingBottom: dockPadding }]}>
      {busyNotice ? (
        <Text style={styles.notice} tone="warning" variant="subhead" weight="600">
          {busyNotice}
        </Text>
      ) : null}
      <ChatComposer
        disabled={disabled}
        nativeID="chat-input"
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
