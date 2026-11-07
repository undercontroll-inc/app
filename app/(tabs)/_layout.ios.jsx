import { DefaultTheme, ThemeProvider } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "../../theme";
import { TabBarVisibilityProvider, useTabBarVisibility } from "../../contexts/TabBarVisibilityContext";

export const unstable_settings = {
  initialRouteName: "orders",
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.navy,
    card: colors.navy,
    primary: colors.orange,
    text: "#ffffff",
  },
};

function NativeTabsLayout() {
  const { hidden } = useTabBarVisibility();

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      hidden={hidden}
      minimizeBehavior="onScrollDown"
      tintColor={colors.orange}
    >
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Consertos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "wrench.and.screwdriver", selected: "wrench.and.screwdriver.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stock">
        <NativeTabs.Trigger.Label>Estoque</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clients">
        <NativeTabs.Trigger.Label>Clientes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Painel</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Ana AI</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" />
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
