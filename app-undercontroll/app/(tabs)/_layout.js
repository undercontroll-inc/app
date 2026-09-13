import { Slot, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import { TabBarVisibilityProvider, useTabBarVisibility } from "../../contexts/TabBarVisibilityContext";

export const unstable_settings = {
  initialRouteName: "orders",
};

function TabsLayoutInner() {
  const pathname = usePathname();
  const { hidden } = useTabBarVisibility();
  const hideNav = hidden || (pathname.startsWith("/orders/") && pathname !== "/orders") || pathname.startsWith("/stock/");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      {!hideNav && <BottomNav />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <TabsLayoutInner />
    </TabBarVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#ffffff", flex: 1 },
  content: { flex: 1 },
});
