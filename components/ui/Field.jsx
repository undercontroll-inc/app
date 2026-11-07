import { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Text from "./Text";
import { colors, MAX_FONT_SCALE, radius } from "../../theme";

const Field = forwardRef(function Field(
  { label, hint, error, multiline, editable = true, style, inputStyle, trailing, ...props },
  ref,
) {
  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Text tone="muted" variant="subhead" weight="600">
          {label}
        </Text>
      ) : null}
      <View
        style={[styles.box, multiline && styles.multilineBox, !editable && styles.readonly, error && styles.errorBox]}
      >
        <TextInput
          ref={ref}
          editable={editable}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline={multiline}
          placeholderTextColor={colors.subtle}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
        {trailing}
      </View>
      {error ? (
        <Text tone="danger" variant="footnote" weight="600">
          {error}
        </Text>
      ) : hint ? (
        <Text tone="muted" variant="footnote">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default Field;

const styles = StyleSheet.create({
  root: { gap: 6 },
  box: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 14,
  },
  multilineBox: { alignItems: "flex-start", minHeight: 110, paddingVertical: 12 },
  readonly: { backgroundColor: colors.surfaceMuted },
  errorBox: { borderColor: colors.danger },
  input: { color: colors.text, flex: 1, fontSize: 17, paddingVertical: 12 },
  multilineInput: { minHeight: 86, paddingVertical: 0 },
});
