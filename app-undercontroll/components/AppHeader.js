import Feather from "@expo/vector-icons/Feather";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { ActionMenuSheet, useActionMenu } from "./ActionMenu";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const menu = useActionMenu();
  const displayName = user?.name || "Admin";

  function openProfile() {
    menu.show({
      title: "Sair da conta?",
      message: "Sua sessão será encerrada.",
      options: [
        {
          label: "Sair",
          destructive: true,
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
        { label: "Cancelar", cancel: true },
      ],
    });
  }

  return (
    <View style={styles.header}>
      <Image source={require("../assets/logo_pelluci.png")} resizeMode="contain" style={styles.logo} />
      <Pressable accessibilityLabel="Abrir opções do perfil" onPress={openProfile} style={styles.admin}>
        <Text numberOfLines={1} style={styles.adminName}>
          {displayName}
        </Text>
        <View style={styles.avatar}>
          <Feather color="#ffffff" name="user" size={16} />
        </View>
      </Pressable>
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#092542",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 14,
    zIndex: 2,
  },
  logo: { height: 32, width: 64 },
  admin: { alignItems: "center", flexDirection: "row", gap: 8, maxWidth: 160 },
  adminName: { color: "#fff", flexShrink: 1, fontSize: 14 },
  avatar: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderColor: "#ffad65",
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
