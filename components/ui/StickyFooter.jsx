import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "./Text";
import { colors } from "../../theme";

export default function StickyFooter({ note, noteTone = "muted", children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }, style]}>
      {note ? (
        <Text align="center" style={styles.note} tone={noteTone} variant="subhead" weight="600">
          {note}
        </Text>
      ) : null}
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 10 },
  note: { marginBottom: 10 },
  actions: { gap: 8 },
});
