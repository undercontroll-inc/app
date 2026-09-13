import { Slot, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";
import BottomNav from "../../components/BottomNav";

export const unstable_settings = {
  initialRouteName: "orders",
};

export default function TabsLayout() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/orders/") && pathname !== "/orders";

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      {!hideNav && <BottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#ffffff", flex: 1 },
  content: { flex: 1 },
});
