import { Text as RNText } from "react-native";
import { colors, MAX_FONT_SCALE, type } from "../../theme";

const TONES = {
  default: colors.text,
  muted: colors.muted,
  subtle: colors.subtle,
  accent: colors.orange,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  inverse: "#ffffff",
};

export default function Text({ variant = "body", tone = "default", weight, align, style, ...props }) {
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...props}
      style={[
        type[variant],
        { color: TONES[tone] ?? tone },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
