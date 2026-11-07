import { StyleSheet, Switch, View } from "react-native";
import Text from "./Text";
import { haptics } from "../../utils/haptics";
import { colors } from "../../theme";

export default function SwitchRow({ label, description, value, onValueChange, disabled, testID }) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="body" weight="600">
          {label}
        </Text>
        {description ? (
          <Text tone="muted" variant="subhead">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={(next) => {
          haptics.selection();
          onValueChange(next);
        }}
        testID={testID}
        trackColor={{ true: colors.success }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 52 },
  text: { flex: 1, gap: 2 },
});
