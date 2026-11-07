import { ActivityIndicator, StyleSheet, View } from "react-native";
import Button from "./Button";
import Icon from "./Icon";
import Text from "./Text";
import { colors } from "../../theme";

export default function StateView({ loading, error, onRetry, icon = "search", title, message, loadingText }) {
  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.orange} size="large" />
        {loadingText ? (
          <Text tone="muted" variant="callout">
            {loadingText}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, error && styles.iconError]}>
        <Icon color={error ? colors.danger : colors.muted} name={error ? "alert" : icon} size={26} />
      </View>
      <Text align="center" variant="headline">
        {error ? "Não foi possível carregar" : title}
      </Text>
      {error || message ? (
        <Text align="center" tone="muted" variant="callout">
          {error || message}
        </Text>
      ) : null}
      {error && onRetry ? <Button label="Tentar novamente" onPress={onRetry} size="md" variant="tinted" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 48 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: 4,
    width: 64,
  },
  iconError: { backgroundColor: colors.dangerSoft },
});
