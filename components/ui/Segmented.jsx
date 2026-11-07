import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { StyleSheet } from "react-native";
import { haptics } from "../../utils/haptics";
import { colors } from "../../theme";

export default function Segmented({ values, selectedIndex, onChange, style }) {
  return (
    <SegmentedControl
      activeFontStyle={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}
      backgroundColor={colors.surfaceMuted}
      fontStyle={{ color: colors.navy, fontSize: 14, fontWeight: "500" }}
      tintColor={colors.orange}
      onChange={(event) => {
        haptics.selection();
        onChange(event.nativeEvent.selectedSegmentIndex);
      }}
      selectedIndex={selectedIndex}
      style={[styles.control, style]}
      values={values}
    />
  );
}

const styles = StyleSheet.create({
  control: { height: 40 },
});
