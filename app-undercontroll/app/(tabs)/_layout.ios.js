import { DefaultTheme, ThemeProvider } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TabBarVisibilityProvider, useTabBarVisibility } from "../../contexts/TabBarVisibilityContext";

export const unstable_settings = {
  initialRouteName: "orders",
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    primary: "#ef7f19",
  },
};

function NativeTabsLayout() {
  const { hidden } = useTabBarVisibility();

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      hidden={hidden}
      minimizeBehavior="onScrollDown"
      tintColor="#ef7f19"
    >
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Consertos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stock">
        <NativeTabs.Trigger.Label>Estoque</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clients">
        <NativeTabs.Trigger.Label>Clientes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.pie" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Ang AI</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bolt" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  return (
    <ThemeProvider value={theme}>
      <TabBarVisibilityProvider>
        <NativeTabsLayout />
      </TabBarVisibilityProvider>
    </ThemeProvider>
  );
}
