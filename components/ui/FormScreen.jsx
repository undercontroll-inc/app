import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import Banner from "./Banner";
import { headerButtonOptions } from "./headerItems";
import StateView from "./StateView";
import StickyFooter from "./StickyFooter";
import { colors } from "../../theme";

export default function FormScreen({
  title,
  onCancel,
  cancelLabel = "Cancelar",
  loading,
  loadingText,
  loadError,
  onRetry,
  feedback,
  footer,
  footerNote,
  children,
  scrollRef,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          ...(title ? { title } : {}),
          ...(onCancel ? headerButtonOptions({ label: cancelLabel, onPress: onCancel }) : {}),
        }}
      />
      {loading || loadError ? (
        <StateView error={loadError} loading={loading} loadingText={loadingText} onRetry={onRetry} />
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={120}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          {children}
          {feedback ? <Banner message={feedback} tone="danger" /> : null}
        </KeyboardAwareScrollView>
      )}
      {footer ? (
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
          <StickyFooter note={footerNote}>{footer}</StickyFooter>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 20, padding: 20, paddingBottom: 32 },
});
